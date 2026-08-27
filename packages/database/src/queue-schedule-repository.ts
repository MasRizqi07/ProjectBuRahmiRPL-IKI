import type { DatabaseClient } from './client'
import type { EnvelopeCipher } from './encryption'

interface SessionRow {
  readonly id: string
  readonly pre_queue_opens_at: Date
  readonly sales_open_at: Date
  readonly sales_close_at: Date
  readonly admission_ttl_seconds: number
  readonly base_admission_rate_per_second: number
  readonly shuffle_commitment: string | null
  readonly shuffle_seed_ciphertext: Uint8Array | null
}

export interface QueueSchedule {
  readonly id: string
  readonly preQueueOpensAt: Date
  readonly salesOpenAt: Date
  readonly salesCloseAt: Date
  readonly admissionTtlSeconds: number
  readonly admissionRatePerSecond: number
  readonly shuffleCommitment: string | null
  readonly shuffleSeed: Buffer | null
}

function mapSchedule(row: SessionRow, cipher: EnvelopeCipher): QueueSchedule {
  return {
    id: row.id,
    preQueueOpensAt: row.pre_queue_opens_at,
    salesOpenAt: row.sales_open_at,
    salesCloseAt: row.sales_close_at,
    admissionTtlSeconds: row.admission_ttl_seconds,
    admissionRatePerSecond: row.base_admission_rate_per_second,
    shuffleCommitment: row.shuffle_commitment,
    shuffleSeed:
      row.shuffle_seed_ciphertext === null
        ? null
        : Buffer.from(cipher.decrypt(row.shuffle_seed_ciphertext), 'base64'),
  }
}

export class QueueScheduleRepository {
  constructor(
    private readonly sql: DatabaseClient,
    private readonly cipher: EnvelopeCipher,
  ) {}

  async dueForPreparation(limit = 20): Promise<readonly QueueSchedule[]> {
    const rows = await this.sql<SessionRow[]>`
      select id, pre_queue_opens_at, sales_open_at, sales_close_at,
             admission_ttl_seconds, base_admission_rate_per_second,
             shuffle_commitment, shuffle_seed_ciphertext
      from ticketing.sales_sessions
      where status = 'DRAFT' and pre_queue_opens_at <= now()
      order by pre_queue_opens_at
      limit ${limit}
    `
    return rows.map((row) => mapSchedule(row, this.cipher))
  }

  async prepare(sessionId: string, seed: Buffer, commitment: string): Promise<boolean> {
    const result = await this.sql`
      update ticketing.sales_sessions
      set status = 'PRE_QUEUE', shuffle_commitment = ${commitment},
          shuffle_seed_ciphertext = ${this.cipher.encrypt(seed.toString('base64'))},
          version = version + 1, updated_at = now()
      where id = ${sessionId} and status = 'DRAFT' and pre_queue_opens_at <= now()
      returning id
    `
    return result.length === 1
  }

  async awaitingOpen(limit = 20): Promise<readonly QueueSchedule[]> {
    const rows = await this.sql<SessionRow[]>`
      select id, pre_queue_opens_at, sales_open_at, sales_close_at,
             admission_ttl_seconds, base_admission_rate_per_second,
             shuffle_commitment, shuffle_seed_ciphertext
      from ticketing.sales_sessions
      where status = 'PRE_QUEUE'
      order by sales_open_at
      limit ${limit}
    `
    return rows.map((row) => mapSchedule(row, this.cipher))
  }

  async markOpen(sessionId: string, commitment: string): Promise<boolean> {
    const result = await this.sql`
      update ticketing.sales_sessions
      set status = 'OPEN', version = version + 1, updated_at = now()
      where id = ${sessionId} and status = 'PRE_QUEUE'
        and sales_open_at <= now() and shuffle_commitment = ${commitment}
      returning id
    `
    return result.length === 1
  }

  async openSessions(limit = 20): Promise<readonly QueueSchedule[]> {
    const rows = await this.sql<SessionRow[]>`
      select id, pre_queue_opens_at, sales_open_at, sales_close_at,
             admission_ttl_seconds, base_admission_rate_per_second,
             shuffle_commitment, shuffle_seed_ciphertext
      from ticketing.sales_sessions
      where status = 'OPEN' and sales_close_at > now()
      order by sales_open_at
      limit ${limit}
    `
    return rows.map((row) => mapSchedule(row, this.cipher))
  }

  async closeEnded(): Promise<readonly string[]> {
    const rows = await this.sql<{ id: string }[]>`
      update ticketing.sales_sessions
      set status = 'CLOSED', version = version + 1, updated_at = now()
      where status in ('PRE_QUEUE', 'OPEN', 'PAUSED') and sales_close_at <= now()
      returning id
    `
    return rows.map((row) => row.id)
  }
}
