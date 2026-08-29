import type { DatabaseClient } from './client'

export type TenantMembershipRole = 'OWNER' | 'ADMIN' | 'OPERATOR' | 'FINANCE' | 'VIEWER'

export interface TenantMembership {
  readonly tenantId: string
  readonly role: TenantMembershipRole
  readonly createdAt?: string
}

interface TenantMembershipRow {
  readonly tenant_id: string
  readonly role: TenantMembershipRole
  readonly created_at: Date
}

export class TenantMembershipRepository {
  constructor(private readonly sql: DatabaseClient) {}

  async getTenantMembershipsForUser(userId: string): Promise<readonly TenantMembership[]> {
    const rows = await this.sql<TenantMembershipRow[]>`
      select tenant_id, role, created_at
      from ticketing.tenant_memberships
      where user_id = ${userId}
      order by created_at asc
    `

    return rows.map((row) => ({
      tenantId: row.tenant_id,
      role: row.role,
      createdAt: row.created_at.toISOString(),
    }))
  }
}

