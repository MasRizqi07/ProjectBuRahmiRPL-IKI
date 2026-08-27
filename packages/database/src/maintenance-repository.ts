import type { DatabaseClient } from './client'

export class MaintenanceRepository {
  constructor(private readonly sql: DatabaseClient) {}

  async expireReservations(batchSize = 100): Promise<number> {
    const rows = await this.sql<{ expired_count: number }[]>`
      select ticketing.expire_reservations(${batchSize}) as expired_count
    `
    return rows[0]?.expired_count ?? 0
  }

  async redactExpiredNik(batchSize = 100): Promise<number> {
    const rows = await this.sql<{ count: number }[]>`
      select ticketing.redact_expired_nik(${batchSize})::integer as count
    `
    return rows[0]?.count ?? 0
  }
}
