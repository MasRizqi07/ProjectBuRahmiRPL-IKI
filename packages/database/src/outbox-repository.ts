import type { DatabaseClient } from './client'

export interface OutboxMessage {
  readonly id: string
  readonly tenantId: string
  readonly topic: string
  readonly aggregateType: string
  readonly aggregateId: string
  readonly payload: Readonly<Record<string, unknown>>
  readonly attempts: number
}

interface OutboxRow {
  readonly id: string
  readonly tenant_id: string
  readonly topic: string
  readonly aggregate_type: string
  readonly aggregate_id: string
  readonly payload: Readonly<Record<string, unknown>>
  readonly attempts: number
}

export class OutboxRepository {
  constructor(private readonly sql: DatabaseClient) {}

  async claim(workerId: string, batchSize: number): Promise<readonly OutboxMessage[]> {
    const rows = await this.sql<OutboxRow[]>`
      with candidates as (
        select id
        from ticketing.outbox
        where status in ('PENDING', 'FAILED')
          and available_at <= now()
          and (locked_at is null or locked_at < now() - interval '5 minutes')
        order by available_at, created_at
        for update skip locked
        limit ${batchSize}
      )
      update ticketing.outbox message
      set status = 'PROCESSING', locked_at = now(), locked_by = ${workerId},
          attempts = attempts + 1
      from candidates
      where message.id = candidates.id
      returning message.id, message.tenant_id, message.topic,
                message.aggregate_type, message.aggregate_id,
                message.payload, message.attempts
    `
    return rows.map((row) => ({
      id: row.id,
      tenantId: row.tenant_id,
      topic: row.topic,
      aggregateType: row.aggregate_type,
      aggregateId: row.aggregate_id,
      payload: row.payload,
      attempts: row.attempts,
    }))
  }

  async complete(messageId: string, workerId: string): Promise<void> {
    await this.sql`
      update ticketing.outbox
      set status = 'COMPLETED', completed_at = now(), locked_at = null, locked_by = null
      where id = ${messageId} and status = 'PROCESSING' and locked_by = ${workerId}
    `
  }

  async fail(message: OutboxMessage, workerId: string, error: string): Promise<void> {
    const delaySeconds = Math.min(2 ** Math.min(message.attempts, 8), 300)
    await this.sql`
      update ticketing.outbox
      set status = 'FAILED', available_at = now() + make_interval(secs => ${delaySeconds}),
          locked_at = null, locked_by = null, last_error = ${error.slice(0, 2_000)}
      where id = ${message.id} and status = 'PROCESSING' and locked_by = ${workerId}
    `
  }
}
