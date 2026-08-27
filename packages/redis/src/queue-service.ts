import { createHash, createHmac, randomUUID } from 'node:crypto'
import type { QueueJoinResponse, QueueStatusResponse } from '@war-ticket/contracts'
import { DomainError } from '@war-ticket/domain'
import type { RedisClient } from './client'
import { signAdmissionToken, verifyAdmissionToken } from './token'
import type { AdmissionClaims } from './token'

type QueuePhase = 'PRE_QUEUE' | 'SHUFFLING' | 'OPEN' | 'PAUSED' | 'CLOSED'

interface QueueServiceOptions {
  readonly signingSecret: string
  readonly defaultAdmissionTtlSeconds?: number
  readonly defaultPollAfterMs?: number
}

interface QueueKeys {
  readonly prefix: string
  readonly entries: string
  readonly users: string
  readonly entryUsers: string
  readonly statuses: string
  readonly admittedAt: string
  readonly metadata: string
  readonly fifo: string
}

const JOIN_SCRIPT = `
local phase = redis.call('HGET', KEYS[1], 'phase')
if not phase then return {'ERROR', 'NOT_PREPARED'} end
if phase == 'PAUSED' or phase == 'SHUFFLING' then return {'ERROR', 'PAUSED'} end
if phase == 'CLOSED' then return {'ERROR', 'CLOSED'} end

local existing = redis.call('HGET', KEYS[3], ARGV[1])
if existing then
  local status = redis.call('HGET', KEYS[5], existing) or phase
  return {'EXISTING', existing, status}
end

local score = tonumber(ARGV[3])
local status = 'PRE_QUEUE'
if phase == 'OPEN' then
  score = redis.call('INCR', KEYS[6])
  status = 'WAITING'
end

redis.call('HSET', KEYS[3], ARGV[1], ARGV[2])
redis.call('HSET', KEYS[4], ARGV[2], ARGV[1])
redis.call('HSET', KEYS[5], ARGV[2], status)
redis.call('ZADD', KEYS[2], score, ARGV[2])
return {'CREATED', ARGV[2], status}
`

const ADMIT_SCRIPT = `
local phase = redis.call('HGET', KEYS[1], 'phase')
if phase ~= 'OPEN' then return {} end
local entries = redis.call('ZRANGE', KEYS[2], 0, tonumber(ARGV[1]) - 1)
for _, entry in ipairs(entries) do
  redis.call('ZREM', KEYS[2], entry)
  redis.call('HSET', KEYS[3], entry, 'ADMITTED')
  redis.call('HSET', KEYS[4], entry, ARGV[2])
end
return entries
`

const CONSUME_SCRIPT = `
local owner = redis.call('GET', KEYS[1])
if not owner then return 0 end
if owner ~= ARGV[1] then return -1 end
redis.call('DEL', KEYS[1])
redis.call('HSET', KEYS[2], ARGV[2], 'CONSUMED')
return 1
`

function queueKeys(salesSessionId: string): QueueKeys {
  const prefix = `wt:{${salesSessionId}}`
  return {
    prefix,
    entries: `${prefix}:entries`,
    users: `${prefix}:users`,
    entryUsers: `${prefix}:entry-users`,
    statuses: `${prefix}:statuses`,
    admittedAt: `${prefix}:admitted-at`,
    metadata: `${prefix}:metadata`,
    fifo: `${prefix}:fifo`,
  }
}

function admissionJti(secret: string, salesSessionId: string, entryId: string): string {
  return createHmac('sha256', secret)
    .update(`admission:${salesSessionId}:${entryId}`)
    .digest('base64url')
}

export class QueueService {
  private readonly admissionTtlSeconds: number
  private readonly pollAfterMs: number

  constructor(
    private readonly redis: RedisClient,
    private readonly options: QueueServiceOptions,
  ) {
    this.admissionTtlSeconds = options.defaultAdmissionTtlSeconds ?? 120
    this.pollAfterMs = options.defaultPollAfterMs ?? 5_000
  }

  async prepareSession(input: {
    salesSessionId: string
    opensAt: Date
    closesAt: Date
    admissionRatePerSecond: number
  }): Promise<void> {
    const keys = queueKeys(input.salesSessionId)
    await this.redis.hsetnx(keys.metadata, 'phase', 'PRE_QUEUE')
    await this.redis.hset(keys.metadata, {
      opensAt: input.opensAt.toISOString(),
      closesAt: input.closesAt.toISOString(),
      admissionRatePerSecond: String(input.admissionRatePerSecond),
    })
  }

  async inspectSession(salesSessionId: string): Promise<{
    phase: QueuePhase | null
    shuffleCommitment: string | null
  }> {
    const keys = queueKeys(salesSessionId)
    const [phase, shuffleCommitment] = await this.redis.hmget(
      keys.metadata,
      'phase',
      'shuffleCommitment',
    )
    return {
      phase: (phase ?? null) as QueuePhase | null,
      shuffleCommitment: shuffleCommitment ?? null,
    }
  }

  async closeSession(salesSessionId: string): Promise<void> {
    await this.redis.hset(queueKeys(salesSessionId).metadata, 'phase', 'CLOSED')
  }

  async join(salesSessionId: string, userId: string): Promise<QueueJoinResponse> {
    const keys = queueKeys(salesSessionId)
    const entryId = randomUUID()
    const result = await this.redis.eval(
      JOIN_SCRIPT,
      6,
      keys.metadata,
      keys.entries,
      keys.users,
      keys.entryUsers,
      keys.statuses,
      keys.fifo,
      userId,
      entryId,
      Date.now(),
    )
    if (!Array.isArray(result)) throw new DomainError('CONFLICT', 'Queue join failed', { retryable: true })
    const [outcome, returnedEntryId, state] = result.map(String)
    if (outcome === 'ERROR') {
      if (returnedEntryId === 'CLOSED') throw new DomainError('NOT_FOUND', 'Sales queue is closed')
      if (returnedEntryId === 'NOT_PREPARED') throw new DomainError('NOT_FOUND', 'Sales queue is not ready')
      throw new DomainError('CONFLICT', 'Sales queue is temporarily paused', { retryable: true })
    }
    if (returnedEntryId === undefined || state === undefined) {
      throw new DomainError('CONFLICT', 'Queue join returned an invalid result', { retryable: true })
    }
    return this.buildStatus(salesSessionId, returnedEntryId, state)
  }

  async getStatus(salesSessionId: string, userId: string): Promise<QueueStatusResponse> {
    const keys = queueKeys(salesSessionId)
    const entryId = await this.redis.hget(keys.users, userId)
    if (entryId === null) throw new DomainError('NOT_FOUND', 'Queue entry was not found')
    const state = await this.redis.hget(keys.statuses, entryId)
    if (state === null) throw new DomainError('NOT_FOUND', 'Queue state was not found')
    return this.buildStatus(salesSessionId, entryId, state)
  }

  async openSession(salesSessionId: string, seed: Buffer): Promise<{ commitment: string; size: number }> {
    const keys = queueKeys(salesSessionId)
    const transitioned = await this.redis.eval(
      `local phase = redis.call('HGET', KEYS[1], 'phase'); if phase == 'PRE_QUEUE' then redis.call('HSET', KEYS[1], 'phase', 'SHUFFLING'); return 1 elseif phase == 'SHUFFLING' then return 2 else return 0 end`,
      1,
      keys.metadata,
    )
    if (Number(transitioned) !== 1 && Number(transitioned) !== 2) {
      throw new DomainError('INVALID_STATE_TRANSITION', 'Queue is not in pre-queue state')
    }

    const entries = await this.redis.zrange(keys.entries, 0, -1)
    const ranked = entries
      .map((entryId) => ({
        entryId,
        digest: createHmac('sha256', seed).update(entryId).digest('hex'),
      }))
      .sort((left, right) => left.digest.localeCompare(right.digest))

    const transaction = this.redis.multi()
    if (ranked.length > 0) {
      transaction.zadd(
        keys.entries,
        ...ranked.flatMap(({ entryId }, index) => [index + 1, entryId]),
      )
      for (const { entryId } of ranked) transaction.hset(keys.statuses, entryId, 'WAITING')
    }
    transaction.set(keys.fifo, String(ranked.length))
    transaction.hset(keys.metadata, {
      phase: 'OPEN',
      preQueueSize: String(ranked.length),
      shuffleCommitment: createHash('sha256').update(seed).digest('hex'),
    })
    await transaction.exec()

    return {
      commitment: createHash('sha256').update(seed).digest('hex'),
      size: ranked.length,
    }
  }

  async admitNext(salesSessionId: string, count: number): Promise<readonly string[]> {
    if (!Number.isSafeInteger(count) || count < 1 || count > 1_000) {
      throw new DomainError('VALIDATION_ERROR', 'Admission batch size is invalid')
    }
    const keys = queueKeys(salesSessionId)
    const admittedAt = String(Date.now())
    const result = await this.redis.eval(
      ADMIT_SCRIPT,
      4,
      keys.metadata,
      keys.entries,
      keys.statuses,
      keys.admittedAt,
      count,
      admittedAt,
    )
    return Array.isArray(result) ? result.map(String) : []
  }

  async consumeAdmissionToken(input: {
    token: string
    salesSessionId: string
    userId: string
  }): Promise<void> {
    const claims = verifyAdmissionToken(input.token, this.options.signingSecret)
    if (claims.salesSessionId !== input.salesSessionId || claims.userId !== input.userId) {
      throw new DomainError('ADMISSION_REQUIRED', 'Admission token does not match the request')
    }
    const keys = queueKeys(input.salesSessionId)
    const result = await this.redis.eval(
      CONSUME_SCRIPT,
      2,
      `${keys.prefix}:admission:${claims.jti}`,
      keys.statuses,
      input.userId,
      claims.entryId,
    )
    if (Number(result) === 0) throw new DomainError('ADMISSION_EXPIRED', 'Admission token was used or expired')
    if (Number(result) === -1) throw new DomainError('ADMISSION_REQUIRED', 'Admission token owner is invalid')
  }

  validateAdmissionToken(input: {
    token: string
    salesSessionId: string
    userId: string
  }): AdmissionClaims {
    const claims = verifyAdmissionToken(input.token, this.options.signingSecret)
    if (claims.salesSessionId !== input.salesSessionId || claims.userId !== input.userId) {
      throw new DomainError('ADMISSION_REQUIRED', 'Admission token does not match the request')
    }
    return claims
  }

  private async buildStatus(
    salesSessionId: string,
    entryId: string,
    state: string,
  ): Promise<QueueStatusResponse> {
    const keys = queueKeys(salesSessionId)
    const position = state === 'WAITING' ? (await this.redis.zrank(keys.entries, entryId)) : null
    const admissionRateRaw = await this.redis.hget(keys.metadata, 'admissionRatePerSecond')
    const admissionRate = Math.max(Number(admissionRateRaw ?? 1), 1)
    const response: QueueStatusResponse = {
      entryId,
      salesSessionId,
      state: state as QueueStatusResponse['state'],
      position: position === null ? null : position + 1,
      estimatedWaitSeconds: position === null ? null : Math.ceil((position + 1) / admissionRate),
      pollAfterMs: state === 'ADMITTED' ? 1_000 : this.pollAfterMs,
    }

    if (state !== 'ADMITTED') return response

    const admittedAtRaw = await this.redis.hget(keys.admittedAt, entryId)
    const userId = await this.redis.hget(keys.entryUsers, entryId)
    if (admittedAtRaw === null || userId === null) {
      throw new DomainError('CONFLICT', 'Admission state is incomplete', { retryable: true })
    }
    const expiresAtEpochSeconds = Math.floor(Number(admittedAtRaw) / 1_000) + this.admissionTtlSeconds
    if (expiresAtEpochSeconds <= Math.floor(Date.now() / 1_000)) {
      await this.redis.hset(keys.statuses, entryId, 'EXPIRED')
      return { ...response, state: 'EXPIRED', pollAfterMs: this.pollAfterMs }
    }
    const jti = admissionJti(this.options.signingSecret, salesSessionId, entryId)
    const token = signAdmissionToken(
      { v: 1, jti, salesSessionId, entryId, userId, expiresAtEpochSeconds },
      this.options.signingSecret,
    )
    const ttlMilliseconds = expiresAtEpochSeconds * 1_000 - Date.now()
    await this.redis.set(`${keys.prefix}:admission:${jti}`, userId, 'PX', ttlMilliseconds, 'NX')
    return {
      ...response,
      admissionToken: token,
      admissionExpiresAt: new Date(expiresAtEpochSeconds * 1_000).toISOString(),
    }
  }
}
