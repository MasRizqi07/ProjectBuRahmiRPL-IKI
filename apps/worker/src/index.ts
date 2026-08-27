import { createHash, randomBytes } from 'node:crypto'
import { setTimeout as delay } from 'node:timers/promises'
import { z } from 'zod'
import { parseWorkerConfig } from '@war-ticket/config'
import {
  createDatabaseClient,
  EnvelopeCipher,
  MaintenanceRepository,
  OutboxRepository,
  PaymentRepository,
  QueueScheduleRepository,
  type OutboxMessage,
} from '@war-ticket/database'
import { DomainError } from '@war-ticket/domain'
import { createLogger } from '@war-ticket/observability'
import { MidtransClient } from '@war-ticket/payments'
import { createRedisClient, QueueService } from '@war-ticket/redis'

const paymentEventSchema = z.object({
  paymentAttemptId: z.string().uuid(),
})

const config = parseWorkerConfig(process.env)
const logger = createLogger({ service: 'worker', workerId: config.WORKER_ID })
const database = createDatabaseClient(config.DATABASE_URL)
const redis = createRedisClient(config.REDIS_URL)
const cipher = new EnvelopeCipher(config.CREDENTIAL_ENCRYPTION_KEY)
const outbox = new OutboxRepository(database)
const payments = new PaymentRepository(database, cipher)
const maintenance = new MaintenanceRepository(database)
const schedules = new QueueScheduleRepository(database, cipher)
const queue = new QueueService(redis, { signingSecret: config.QUEUE_SIGNING_SECRET })

let stopping = false

async function dispatch(message: OutboxMessage): Promise<void> {
  const payload = paymentEventSchema.parse(message.payload)
  if (message.topic === 'payment.create') {
    const context = await payments.getCreationContext(payload.paymentAttemptId)
    const midtrans = new MidtransClient(context.serverKey, context.production)
    try {
      const session = await midtrans.createPayment(context.request)
      await payments.markReady({
        paymentAttemptId: context.attemptId,
        token: session.token,
        redirectUrl: session.redirectUrl,
      })
    } catch (error) {
      if (error instanceof DomainError && error.code === 'PAYMENT_PROVIDER_UNAVAILABLE') {
        await payments.markInitiationUnknown(context.attemptId, error.message)
      }
      throw error
    }
    return
  }

  if (message.topic === 'payment.expire') {
    const context = await payments.getManagementContext(payload.paymentAttemptId)
    await new MidtransClient(context.serverKey, context.production).expirePayment(
      context.providerOrderId,
    )
    return
  }

  throw new DomainError('VALIDATION_ERROR', `Unsupported outbox topic: ${message.topic}`)
}

async function processOutbox(): Promise<void> {
  const messages = await outbox.claim(config.WORKER_ID, config.OUTBOX_BATCH_SIZE)
  for (const message of messages) {
    try {
      await dispatch(message)
      await outbox.complete(message.id, config.WORKER_ID)
    } catch (error) {
      const description = error instanceof Error ? `${error.name}: ${error.message}` : String(error)
      await outbox.fail(message, config.WORKER_ID, description)
      logger.warn('outbox_message_failed', {
        messageId: message.id,
        topic: message.topic,
        attempt: message.attempts,
        error: description,
      })
    }
  }
}

async function prepareQueues(): Promise<void> {
  const due = await schedules.dueForPreparation()
  for (const session of due) {
    const seed = randomBytes(32)
    const commitment = createHash('sha256').update(seed).digest('hex')
    if (await schedules.prepare(session.id, seed, commitment)) {
      await queue.prepareSession({
        salesSessionId: session.id,
        opensAt: session.salesOpenAt,
        closesAt: session.salesCloseAt,
        admissionRatePerSecond: session.admissionRatePerSecond,
      })
      logger.info('pre_queue_prepared', { salesSessionId: session.id, commitment })
    }
  }
}

async function openAndAdmitQueues(): Promise<void> {
  const awaitingOpen = await schedules.awaitingOpen()
  for (const session of awaitingOpen) {
    await queue.prepareSession({
      salesSessionId: session.id,
      opensAt: session.salesOpenAt,
      closesAt: session.salesCloseAt,
      admissionRatePerSecond: session.admissionRatePerSecond,
    })
    if (session.salesOpenAt.getTime() > Date.now() || session.shuffleSeed === null) continue
    const state = await queue.inspectSession(session.id)
    if (state.phase === 'OPEN' && state.shuffleCommitment !== null) {
      await schedules.markOpen(session.id, state.shuffleCommitment)
      continue
    }
    const opened = await queue.openSession(session.id, session.shuffleSeed)
    if (opened.commitment !== session.shuffleCommitment) {
      throw new DomainError('CONFLICT', 'Queue shuffle commitment mismatch')
    }
    await schedules.markOpen(session.id, opened.commitment)
    logger.info('sales_queue_opened', {
      salesSessionId: session.id,
      cohortSize: opened.size,
      commitment: opened.commitment,
    })
  }

  const openSessions = await schedules.openSessions()
  for (const session of openSessions) {
    const admitted = await queue.admitNext(session.id, session.admissionRatePerSecond)
    if (admitted.length > 0) {
      logger.info('queue_batch_admitted', {
        salesSessionId: session.id,
        count: admitted.length,
      })
    }
  }

  const ended = await schedules.closeEnded()
  for (const salesSessionId of ended) await queue.closeSession(salesSessionId)
}

async function tick(): Promise<void> {
  const results = await Promise.allSettled([
    prepareQueues(),
    openAndAdmitQueues(),
    processOutbox(),
    maintenance.expireReservations(config.OUTBOX_BATCH_SIZE),
    maintenance.redactExpiredNik(config.OUTBOX_BATCH_SIZE),
  ])
  results.forEach((result, index) => {
    if (result.status === 'rejected') {
      logger.error('worker_task_failed', {
        taskIndex: index,
        error:
          result.reason instanceof Error
            ? { name: result.reason.name, message: result.reason.message }
            : String(result.reason),
      })
    }
  })
}

async function shutdown(signal: string): Promise<void> {
  if (stopping) return
  stopping = true
  logger.info('worker_stopping', { signal })
  await Promise.allSettled([database.end({ timeout: 5 }), redis.quit()])
}

process.once('SIGINT', () => void shutdown('SIGINT'))
process.once('SIGTERM', () => void shutdown('SIGTERM'))

logger.info('worker_started')
while (!stopping) {
  await tick()
  if (!stopping) await delay(config.WORKER_POLL_INTERVAL_MS)
}
