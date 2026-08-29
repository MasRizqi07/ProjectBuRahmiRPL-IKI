import type {
  ReservationDetailResponse,
  SalesInventoryResponse,
} from '@war-ticket/contracts'
import { DomainError } from '@war-ticket/domain'
import type { DatabaseClient } from './client'

interface TicketTypeRow {
  readonly id: string
  readonly code: string
  readonly name: string
  readonly inventory_mode: 'GENERAL_ADMISSION' | 'ASSIGNED_SEAT'
  readonly price: number
  readonly available: number
}

interface SeatInventoryRow {
  readonly id: string
  readonly ticket_type_id: string
  readonly section: string
  readonly row_label: string
  readonly seat_number: string
  readonly price: number
  readonly status: string
}

export class CatalogRepository {
  constructor(private readonly sql: DatabaseClient) {}

  async getSalesInventory(salesSessionId: string): Promise<SalesInventoryResponse> {
    const sessions = await this.sql<{ id: string; event_id: string; title: string; starts_at: Date }[]>`
      select session.id, event.id as event_id, event.title, event.starts_at
      from ticketing.sales_sessions session
      join ticketing.events event
        on event.tenant_id = session.tenant_id and event.id = session.event_id
      where session.id = ${salesSessionId}
        and session.status in ('PRE_QUEUE', 'OPEN', 'PAUSED')
    `
    const session = sessions[0]
    if (session === undefined) throw new DomainError('NOT_FOUND', 'Sales session was not found')

    const ticketTypes = await this.sql<TicketTypeRow[]>`
      select type.id, type.code, type.name, type.inventory_mode, type.price,
             case
               when type.inventory_mode = 'GENERAL_ADMISSION'
                 then greatest(coalesce(pool.capacity - pool.held - pool.sold, 0), 0)
               else count(seat.id) filter (where seat.status = 'AVAILABLE')::integer
             end as available
      from ticketing.ticket_types type
      left join ticketing.inventory_pools pool
        on pool.tenant_id = type.tenant_id and pool.ticket_type_id = type.id
      left join ticketing.event_seats seat
        on seat.tenant_id = type.tenant_id and seat.ticket_type_id = type.id
      where type.event_id = ${session.event_id}
      group by type.id, pool.capacity, pool.held, pool.sold
      order by type.price, type.code
    `
    const seats = await this.sql<SeatInventoryRow[]>`
      select event_seat.id, event_seat.ticket_type_id, section.name as section,
             venue_seat.row_label, venue_seat.seat_number,
             coalesce(event_seat.price_override, ticket_type.price)::integer as price,
             event_seat.status
      from ticketing.event_seats event_seat
      join ticketing.ticket_types ticket_type
        on ticket_type.tenant_id = event_seat.tenant_id
       and ticket_type.id = event_seat.ticket_type_id
      join ticketing.venue_seats venue_seat
        on venue_seat.tenant_id = event_seat.tenant_id
       and venue_seat.id = event_seat.venue_seat_id
      join ticketing.venue_sections section
        on section.tenant_id = venue_seat.tenant_id and section.id = venue_seat.section_id
      where event_seat.event_id = ${session.event_id}
      order by section.sort_order, venue_seat.row_label, venue_seat.seat_number
    `
    return {
      salesSessionId,
      event: {
        id: session.event_id,
        title: session.title,
        startsAt: session.starts_at.toISOString(),
      },
      ticketTypes: ticketTypes.map((type) => ({
        id: type.id,
        code: type.code,
        name: type.name,
        mode: type.inventory_mode,
        price: type.price,
        available: type.available,
      })),
      seats: seats.map((seat) => ({
        id: seat.id,
        ticketTypeId: seat.ticket_type_id,
        section: seat.section,
        row: seat.row_label,
        number: seat.seat_number,
        price: seat.price,
        available: seat.status === 'AVAILABLE',
      })),
    }
  }

  async getActiveSalesSession(eventId: string): Promise<{ id: string; title: string }> {
    const rows = await this.sql<{ id: string; title: string }[]>`
      select session.id, event.title
      from ticketing.sales_sessions session
      join ticketing.events event
        on event.tenant_id = session.tenant_id and event.id = session.event_id
      where session.event_id = ${eventId}
        and session.status in ('PRE_QUEUE', 'OPEN', 'PAUSED')
        and session.sales_close_at > now()
      order by session.sales_open_at
      limit 1
    `
    const row = rows[0]
    if (row === undefined) throw new DomainError('NOT_FOUND', 'Belum ada sesi penjualan aktif untuk event ini')
    return row
  }

  async assertSalesSessionEligible(salesSessionId: string, userId: string): Promise<void> {
    const rows = await this.sql<Array<{ required_tier: 'ELITE' | 'VANGUARD' | null; member_tier: 'ELITE' | 'VANGUARD' | null }>>`
      select presale.required_tier, membership.tier as member_tier
      from ticketing.sales_sessions session
      left join ticketing.elite_presales presale on presale.sales_session_id = session.id
      left join public.elite_memberships membership
        on membership.user_id = ${userId} and membership.status = 'ACTIVE'
       and membership.starts_at <= now() and membership.ends_at > now()
      where session.id = ${salesSessionId}
    `
    const row = rows[0]
    if (!row) throw new DomainError('NOT_FOUND', 'Sales session was not found')
    if (row.required_tier && !row.member_tier) throw new DomainError('FORBIDDEN', 'An active Elite membership is required for this presale')
    if (row.required_tier === 'VANGUARD' && row.member_tier !== 'VANGUARD') throw new DomainError('FORBIDDEN', 'Vanguard membership is required for this presale')
  }

  async getReservation(
    reservationId: string,
    userId: string,
  ): Promise<ReservationDetailResponse> {
    const rows = await this.sql<{
      id: string
      status: ReservationDetailResponse['status']
      expires_at: Date
      subtotal: number
      service_fee: number
      total: number
      currency: 'IDR'
      event_title: string
    }[]>`
      select reservation.id, reservation.status, reservation.expires_at,
             reservation.subtotal, reservation.service_fee, reservation.total,
             reservation.currency, event.title as event_title
      from ticketing.reservations reservation
      join ticketing.events event
        on event.tenant_id = reservation.tenant_id and event.id = reservation.event_id
      where reservation.id = ${reservationId} and reservation.user_id = ${userId}
    `
    const reservation = rows[0]
    if (reservation === undefined) throw new DomainError('NOT_FOUND', 'Reservation was not found')
    const items = await this.sql<{ label: string; quantity: number; unit_price: number }[]>`
      select label, quantity, unit_price
      from ticketing.reservation_items
      where reservation_id = ${reservationId}
      order by id
    `
    return {
      id: reservation.id,
      status: reservation.status,
      expiresAt: reservation.expires_at.toISOString(),
      subtotal: reservation.subtotal,
      serviceFee: reservation.service_fee,
      total: reservation.total,
      currency: reservation.currency,
      eventTitle: reservation.event_title,
      items: items.map((item) => ({
        label: item.label,
        quantity: item.quantity,
        unitPrice: item.unit_price,
      })),
    }
  }
}
