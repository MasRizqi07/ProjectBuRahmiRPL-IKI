import { DomainError } from '@war-ticket/domain'
import type { DatabaseClient } from './client'

export interface BuyerTicket {
  readonly id: string
  readonly orderId: string
  readonly ticketCode: string
  readonly status: 'ACTIVE' | 'REDEEMED' | 'VOID' | 'REFUNDED'
  readonly eventId: string
  readonly eventTitle: string
  readonly startsAt: string
  readonly label: string
  readonly price: number
  readonly issuedAt: string
  readonly redeemedAt: string | null
}

interface BuyerTicketRow {
  readonly id: string
  readonly order_id: string
  readonly ticket_code: string
  readonly status: BuyerTicket['status']
  readonly event_id: string
  readonly event_title: string
  readonly starts_at: Date
  readonly label: string
  readonly unit_price: number
  readonly issued_at: Date
  readonly redeemed_at: Date | null
}

export class BuyerRepository {
  constructor(private readonly sql: DatabaseClient) {}

  async listTickets(userId: string): Promise<readonly BuyerTicket[]> {
    const rows = await this.sql<BuyerTicketRow[]>`
      select ticket.id, ticket.order_id, ticket.ticket_code, ticket.status,
             event.id as event_id, event.title as event_title, event.starts_at,
             item.label, item.unit_price, ticket.issued_at, ticket.redeemed_at
      from ticketing.tickets ticket
      join ticketing.orders orders on orders.tenant_id = ticket.tenant_id and orders.id = ticket.order_id
      join ticketing.order_items item on item.tenant_id = ticket.tenant_id and item.id = ticket.order_item_id
      join ticketing.reservations reservation on reservation.tenant_id = orders.tenant_id and reservation.id = orders.reservation_id
      join ticketing.events event on event.tenant_id = reservation.tenant_id and event.id = reservation.event_id
      where ticket.owner_user_id = ${userId}
      order by event.starts_at desc, ticket.sequence
    `
    return rows.map((row) => ({
      id: row.id,
      orderId: row.order_id,
      ticketCode: row.ticket_code,
      status: row.status,
      eventId: row.event_id,
      eventTitle: row.event_title,
      startsAt: row.starts_at.toISOString(),
      label: row.label,
      price: row.unit_price,
      issuedAt: row.issued_at.toISOString(),
      redeemedAt: row.redeemed_at?.toISOString() ?? null,
    }))
  }

  async getTicket(ticketId: string, userId: string): Promise<BuyerTicket> {
    const tickets = await this.listTickets(userId)
    const ticket = tickets.find((candidate) => candidate.id === ticketId)
    if (!ticket) throw new DomainError('NOT_FOUND', 'Ticket was not found')
    return ticket
  }

  async storeQrToken(input: { ticketId: string; userId: string; tokenHash: string; expiresAt: Date }): Promise<void> {
    const rows = await this.sql`
      insert into ticketing.ticket_qr_tokens (token_hash, ticket_id, owner_user_id, expires_at)
      select ${input.tokenHash}, ticket.id, ticket.owner_user_id, ${input.expiresAt}
      from ticketing.tickets ticket
      where ticket.id = ${input.ticketId} and ticket.owner_user_id = ${input.userId} and ticket.status = 'ACTIVE'
      returning token_hash
    `
    if (rows.length !== 1) throw new DomainError('NOT_FOUND', 'Active ticket was not found')
  }

  async redeemTicket(input: { tokenHash: string; ticketId: string; actorUserId: string; authorizedTenantId: string | null; gate: string }): Promise<BuyerTicket['status']> {
    return this.sql.begin(async (transaction) => {
      const tokens = await transaction<{ ticket_id: string; consumed_at: Date | null; expires_at: Date }[]>`
        select ticket_id, consumed_at, expires_at
        from ticketing.ticket_qr_tokens
        where token_hash = ${input.tokenHash} and ticket_id = ${input.ticketId}
        for update
      `
      const token = tokens[0]
      if (!token || token.expires_at.getTime() <= Date.now()) throw new DomainError('NOT_FOUND', 'QR token is invalid or expired')
      if (token.consumed_at) throw new DomainError('CONFLICT', 'QR token has already been used')
      const tickets = await transaction<{ status: BuyerTicket['status'] }[]>`
        update ticketing.tickets
        set status = 'REDEEMED', redeemed_at = now(), redeemed_by = ${input.actorUserId}, gate = ${input.gate}
        where id = ${token.ticket_id} and status = 'ACTIVE'
          and (${input.authorizedTenantId}::uuid is null or tenant_id = ${input.authorizedTenantId})
        returning status
      `
      if (tickets.length !== 1) throw new DomainError('CONFLICT', 'Ticket is not valid for entry')
      await transaction`update ticketing.ticket_qr_tokens set consumed_at = now() where token_hash = ${input.tokenHash}`
      return tickets[0]!.status
    })
  }
}
