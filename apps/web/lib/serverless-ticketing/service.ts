import { randomUUID } from 'node:crypto'
import type { Redis } from '@upstash/redis'
import { DomainError } from '@war-ticket/domain'
import type { EdgeCheckoutRepository } from '@war-ticket/database'
import { z } from 'zod'
import { queueResponseSchema, reserveResponseSchema } from './contracts'
import type {
  HoldCreatedResponse,
  QueueResponse,
  ReserveRequest,
  ReserveResponse,
} from './contracts'
import { parseEdgeQueueEnvironment } from './config'
import { hashIdempotentRequest } from './idempotency'
import { activeEventsKey, edgeKeys } from './keys'
import {
  FINALIZE_HOLD_SCRIPT,
  JOIN_QUEUE_SCRIPT,
  QUEUE_STATUS_SCRIPT,
  RELEASE_INITIALIZATION_LOCK_SCRIPT,
  RESERVE_SCRIPT,
  SWEEP_EVENT_SCRIPT,
} from './scripts'

interface QueueScriptResult {
  readonly state: string
  readonly rank: number
}

const cachedTierQuoteSchema = z.object({
  tierId: z.string().uuid(),
  tierName: z.string(),
  unitPrice: z.number().int().nonnegative(),
})

type CachedTierQuote = z.infer<typeof cachedTierQuoteSchema>

function delay(milliseconds: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, milliseconds))
}

function arrayResult(value: unknown, operation: string): readonly unknown[] {
  if (!Array.isArray(value)) {
    throw new DomainError('CONFLICT', `${operation} returned an invalid Redis result`, {
      retryable: true,
    })
  }
  return value
}

function parseQueueResult(value: unknown): QueueScriptResult {
  const result = arrayResult(value, 'Queue status')
  const state = String(result[0])
  const rank = Number(result[1])
  if (!Number.isSafeInteger(rank) || rank < 0) {
    if (state === 'NOT_JOINED') throw new DomainError('NOT_FOUND', 'Queue entry was not found')
    throw new DomainError('CONFLICT', 'Queue rank is invalid', { retryable: true })
  }
  return { state, rank }
}

export class ServerlessCheckoutService {
  constructor(
    private readonly redis: Redis,
    private readonly orders: EdgeCheckoutRepository,
  ) {}

  async joinQueue(eventId: string, userId: string): Promise<QueueResponse & { created: boolean }> {
    const keys = edgeKeys(eventId)
    await this.ensureEventInventory(eventId)
    const raw = await this.redis.eval(
      JOIN_QUEUE_SCRIPT,
      [keys.queue, keys.states, keys.queueSequence],
      [userId],
    )
    const result = arrayResult(raw, 'Queue join')
    const created = Number(result[0]) === 1
    const rank = Number(result[1])
    const state = String(result[2])
    await this.redis.sadd(activeEventsKey, eventId)
    return {
      ...queueResponseSchema.parse({
        eventId,
        state,
        rank,
        position: rank + 1,
        pollAfterMs: 3_000 + Math.floor(Math.random() * 2_001),
      }),
      created,
    }
  }

  async queueStatus(eventId: string, userId: string): Promise<QueueResponse> {
    const environment = parseEdgeQueueEnvironment(process.env)
    const keys = edgeKeys(eventId)
    const raw = await this.redis.eval(
      QUEUE_STATUS_SCRIPT,
      [
        keys.queue,
        keys.states,
        keys.released,
        keys.inventory,
        keys.admissionExpiries,
        keys.holdExpiries,
        keys.expiredOrders,
        keys.admission(userId),
      ],
      [
        userId,
        Date.now(),
        environment.CONCURRENT_CHECKOUT_CAPACITY,
        environment.ADMISSION_TTL_SECONDS * 1_000,
        100,
        `${keys.prefix}:admitted-user:`,
        `${keys.prefix}:hold:`,
        `${keys.prefix}:inventory-tier:`,
      ],
    )
    const result = parseQueueResult(raw)
    await this.synchronizeExpiredOrders(eventId)
    return queueResponseSchema.parse({
      eventId,
      state: result.state,
      rank: result.rank,
      position: result.rank + 1,
      pollAfterMs:
        result.state === 'ADMITTED'
          ? 1_000
          : 3_000 + Math.floor(Math.random() * 2_001),
    })
  }

  async reserve(input: {
    eventId: string
    userId: string
    idempotencyKey: string
    request: ReserveRequest
  }): Promise<ReserveResponse> {
    const environment = parseEdgeQueueEnvironment(process.env)
    await this.ensureEventInventory(input.eventId)
    const quote = await this.getTierQuote(input.eventId, input.request)
    const requestHash = hashIdempotentRequest({
      eventId: input.eventId,
      userId: input.userId,
      tierId: quote.tierId,
      quantity: quote.quantity,
    })
    const orderId = randomUUID()
    const providerOrderId = `WT-EDGE-${orderId.replaceAll('-', '')}`
    const expiresAtEpochMs = Date.now() + environment.HOLD_TTL_SECONDS * 1_000
    const response: HoldCreatedResponse = {
      status: 'HOLD_CREATED',
      orderId,
      providerOrderId,
      eventId: input.eventId,
      tierId: quote.tierId,
      tierName: quote.tierName,
      quantity: quote.quantity,
      unitPrice: quote.unitPrice,
      total: quote.amount,
      currency: 'IDR',
      remaining: -1,
      holdExpiresAt: new Date(expiresAtEpochMs).toISOString(),
    }
    const keys = edgeKeys(input.eventId)
    await this.redis.set(keys.tierInventory(quote.tierId), quote.available, { nx: true })
    const holdPayload = JSON.stringify({
      orderId,
      userId: input.userId,
      eventId: input.eventId,
      tierId: quote.tierId,
      quantity: quote.quantity,
      expiresAtEpochMs,
    })
    const raw = await this.redis.eval(
      RESERVE_SCRIPT,
      [
        keys.inventory,
        keys.tierInventory(quote.tierId),
        keys.hold(input.userId),
        keys.admission(input.userId),
        keys.states,
        keys.idempotency(input.idempotencyKey),
        keys.holdExpiries,
      ],
      [
        input.userId,
        quote.quantity,
        expiresAtEpochMs,
        holdPayload,
        requestHash,
        JSON.stringify(response),
        environment.IDEMPOTENCY_TTL_SECONDS,
      ],
    )
    const result = arrayResult(raw, 'Reserve')
    const outcome = String(result[0])
    if (outcome === 'IDEMPOTENCY_CONFLICT') {
      throw new DomainError('IDEMPOTENCY_CONFLICT', 'Idempotency key was used for another request')
    }
    if (outcome === 'NOT_ADMITTED') {
      throw new DomainError('ADMISSION_REQUIRED', 'User is not admitted to checkout')
    }
    if (outcome === 'ACTIVE_HOLD_EXISTS') {
      throw new DomainError('CONFLICT', 'User already has an active hold')
    }
    if (!['CREATED', 'IDEMPOTENT', 'SOLD_OUT'].includes(outcome)) {
      throw new DomainError('CONFLICT', 'Reserve returned an unsupported outcome', {
        retryable: true,
      })
    }
    const parsed = reserveResponseSchema.parse(JSON.parse(String(result[1])) as unknown)
    if (parsed.status === 'SOLD_OUT') return parsed
    await this.orders.upsertHoldOrder(this.toHoldOrder(parsed, input, requestHash))
    return parsed
  }

  async finalizeHold(input: {
    eventId: string
    tierId: string
    userId: string
    orderId: string
    outcome: 'SUCCESS' | 'FAILURE'
  }): Promise<'FINALIZED' | 'ALREADY_SUCCESS' | 'ALREADY_RELEASED'> {
    const keys = edgeKeys(input.eventId)
    const raw = await this.redis.eval(
      FINALIZE_HOLD_SCRIPT,
      [
        keys.hold(input.userId),
        keys.inventory,
        keys.released,
        keys.states,
        keys.holdExpiries,
        keys.tierInventory(input.tierId),
      ],
      [input.userId, input.outcome, input.orderId],
    )
    const result = arrayResult(raw, 'Hold finalization')
    if (Number(result[0]) === -1) {
      throw new DomainError('CONFLICT', 'Redis hold belongs to another order')
    }
    if (Number(result[0]) === 1) return 'FINALIZED'
    return String(result[1]) === 'COMPLETED' ? 'ALREADY_SUCCESS' : 'ALREADY_RELEASED'
  }

  async sweepEvent(eventId: string, limit = 250): Promise<{
    expiredAdmissions: number
    expiredHolds: number
    released: number
  }> {
    const keys = edgeKeys(eventId)
    const raw = await this.redis.eval(
      SWEEP_EVENT_SCRIPT,
      [
        keys.states,
        keys.released,
        keys.admissionExpiries,
        keys.holdExpiries,
        keys.inventory,
        keys.expiredOrders,
      ],
      [
        Date.now(),
        limit,
        `${keys.prefix}:admitted-user:`,
        `${keys.prefix}:hold:`,
        `${keys.prefix}:inventory-tier:`,
      ],
    )
    const result = arrayResult(raw, 'Hold sweep')
    await this.synchronizeExpiredOrders(eventId)
    return {
      expiredAdmissions: Number(result[0]),
      expiredHolds: Number(result[1]),
      released: Number(result[2]),
    }
  }

  private toHoldOrder(
    response: HoldCreatedResponse,
    input: {
      eventId: string
      userId: string
      idempotencyKey: string
      request: ReserveRequest
    },
    requestHash: string,
  ) {
    return {
      id: response.orderId,
      userId: input.userId,
      eventId: input.eventId,
      tierId: response.tierId,
      idempotencyKey: input.idempotencyKey,
      requestHash,
      providerOrderId: response.providerOrderId,
      quantity: response.quantity,
      unitPrice: response.unitPrice,
      amount: response.total,
      holdExpiresAt: new Date(response.holdExpiresAt),
    }
  }

  private async ensureEventInventory(eventId: string): Promise<void> {
    const keys = edgeKeys(eventId)
    await this.loadOnce({
      cacheKey: keys.inventory,
      lockKey: keys.initializationLock('inventory'),
      read: async () => {
        const value = await this.redis.get<number>(keys.inventory)
        return typeof value === 'number' && Number.isSafeInteger(value) && value >= 0
          ? value
          : undefined
      },
      load: async () => this.orders.getEventAvailability(eventId),
      store: async (value) => {
        await this.redis.set(keys.inventory, value, { nx: true })
      },
    })
  }

  private async getTierQuote(eventId: string, request: ReserveRequest) {
    if (request.tierId === undefined) {
      return this.orders.getTierQuote({ eventId, quantity: request.qty })
    }
    const keys = edgeKeys(eventId)
    const tierId = request.tierId
    const cached = await this.loadOnce<CachedTierQuote>({
      cacheKey: keys.tierQuote(tierId),
      lockKey: keys.initializationLock(`tier:${tierId}`),
      read: async () => {
        const [value, inventory] = await Promise.all([
          this.redis.get<unknown>(keys.tierQuote(tierId)),
          this.redis.get<unknown>(keys.tierInventory(tierId)),
        ])
        const parsed = cachedTierQuoteSchema.safeParse(value)
        return parsed.success &&
          typeof inventory === 'number' &&
          Number.isSafeInteger(inventory) &&
          inventory >= 0
          ? parsed.data
          : undefined
      },
      load: async () => {
        const quote = await this.orders.getTierQuote({ eventId, tierId, quantity: 1 })
        await this.redis.set(keys.tierInventory(tierId), quote.available, { nx: true })
        return {
          tierId: quote.tierId,
          tierName: quote.tierName,
          unitPrice: quote.unitPrice,
        }
      },
      store: async (value) => {
        await this.redis.set(keys.tierQuote(tierId), value, { ex: 300 })
      },
    })
    const amount = cached.unitPrice * request.qty
    if (!Number.isSafeInteger(amount)) {
      throw new DomainError('VALIDATION_ERROR', 'Order amount exceeds the safe integer range')
    }
    const available = await this.redis.get<number>(keys.tierInventory(tierId))
    if (typeof available !== 'number' || !Number.isSafeInteger(available) || available < 0) {
      throw new DomainError('CONFLICT', 'Tier inventory cache is invalid', { retryable: true })
    }
    return {
      ...cached,
      quantity: request.qty,
      amount,
      available,
    }
  }

  private async loadOnce<T>(input: {
    cacheKey: string
    lockKey: string
    read: () => Promise<T | undefined>
    load: () => Promise<T>
    store: (value: T) => Promise<void>
  }): Promise<T> {
    const token = randomUUID()
    for (let attempt = 0; attempt < 10; attempt += 1) {
      const cached = await input.read()
      if (cached !== undefined) return cached
      const acquired = await this.redis.set(input.lockKey, token, { nx: true, px: 5_000 })
      if (acquired === 'OK') {
        try {
          const loaded = await input.load()
          await input.store(loaded)
          return loaded
        } finally {
          await this.redis.eval(RELEASE_INITIALIZATION_LOCK_SCRIPT, [input.lockKey], [token])
        }
      }
      await delay(Math.min(25 * 2 ** attempt, 400))
    }
    throw new DomainError('CONFLICT', `Timed out initializing ${input.cacheKey}`, {
      retryable: true,
    })
  }

  private async synchronizeExpiredOrders(eventId: string): Promise<void> {
    const key = edgeKeys(eventId).expiredOrders
    const orderIds = await this.redis.zrange<string[]>(key, 0, 99)
    if (orderIds.length === 0) return
    await this.orders.markExpired(orderIds)
    await this.redis.zrem(key, ...orderIds)
  }
}
