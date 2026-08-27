import { randomUUID } from 'node:crypto'
import type { CreateReservationRequest, ReservationResponse } from '@war-ticket/contracts'
import { calculatePriceQuote, DomainError } from '@war-ticket/domain'
import type { DatabaseClient } from './client'

interface CreateReservationCommand extends CreateReservationRequest {
  readonly userId: string
  readonly admissionEntryId: string
}

interface SalesSessionRow {
  readonly tenant_id: string
  readonly event_id: string
  readonly hold_duration_seconds: number
  readonly max_tickets_per_order: number
  readonly service_fee_basis_points: number
}

interface GeneralAdmissionRow {
  readonly ticket_type_id: string
  readonly name: string
  readonly price: number
  readonly capacity: number
  readonly held: number
  readonly sold: number
}

interface SeatRow {
  readonly id: string
  readonly ticket_type_id: string
  readonly status: string
  readonly name: string
  readonly price: number
  readonly row_label: string
  readonly seat_number: string
}

interface ExistingReservationRow {
  readonly id: string
  readonly status: ReservationResponse['status']
  readonly expires_at: Date
  readonly subtotal: number
  readonly service_fee: number
  readonly total: number
  readonly currency: 'IDR'
}

interface NormalizedGeneralAdmissionItem {
  readonly ticketTypeId: string
  readonly quantity: number
}

function normalizeGeneralAdmission(
  items: CreateReservationRequest['items'],
): readonly NormalizedGeneralAdmissionItem[] {
  const quantities = new Map<string, number>()
  for (const item of items) {
    if (item.kind === 'GENERAL_ADMISSION') {
      quantities.set(item.ticketTypeId, (quantities.get(item.ticketTypeId) ?? 0) + item.quantity)
    }
  }

  return [...quantities]
    .map(([ticketTypeId, quantity]) => ({ ticketTypeId, quantity }))
    .sort((left, right) => left.ticketTypeId.localeCompare(right.ticketTypeId))
}

function normalizeSeatIds(items: CreateReservationRequest['items']): readonly string[] {
  const requested = items.flatMap((item) =>
    item.kind === 'ASSIGNED_SEAT' ? item.eventSeatIds : [],
  )
  const unique = [...new Set(requested)].sort()
  if (unique.length !== requested.length) {
    throw new DomainError('VALIDATION_ERROR', 'A seat may only be requested once')
  }
  return unique
}

export class InventoryRepository {
  constructor(private readonly sql: DatabaseClient) {}

  async createReservation(
    command: CreateReservationCommand,
  ): Promise<ReservationResponse> {
    const reservationId = randomUUID()
    const gaItems = normalizeGeneralAdmission(command.items)
    const seatIds = normalizeSeatIds(command.items)

    return this.sql.begin(async (transaction) => {
      await transaction`set local lock_timeout = '2s'`
      await transaction`set local statement_timeout = '5s'`
      await transaction`select pg_advisory_xact_lock(hashtextextended(${command.admissionEntryId}, 0))`

      const existingRows = await transaction<ExistingReservationRow[]>`
        select id, status, expires_at, subtotal, service_fee, total, currency
        from ticketing.reservations
        where sales_session_id = ${command.salesSessionId}
          and admission_entry_id = ${command.admissionEntryId}
          and user_id = ${command.userId}
      `
      const existing = existingRows[0]
      if (existing !== undefined) {
        return {
          id: existing.id,
          status: existing.status,
          expiresAt: existing.expires_at.toISOString(),
          subtotal: existing.subtotal,
          serviceFee: existing.service_fee,
          total: existing.total,
          currency: existing.currency,
        }
      }

      const sessions = await transaction<SalesSessionRow[]>`
        select tenant_id, event_id, hold_duration_seconds, max_tickets_per_order,
               service_fee_basis_points
        from ticketing.sales_sessions
        where id = ${command.salesSessionId}
          and status = 'OPEN'
          and sales_open_at <= now()
          and sales_close_at > now()
        for share
      `
      const session = sessions[0]
      if (session === undefined) {
        throw new DomainError('NOT_FOUND', 'Active sales session was not found')
      }

      const requestedCount = gaItems.reduce((sum, item) => sum + item.quantity, 0) + seatIds.length
      if (requestedCount > session.max_tickets_per_order) {
        throw new DomainError('VALIDATION_ERROR', 'Ticket limit exceeded', {
          details: { maximum: session.max_tickets_per_order },
        })
      }

      const gaRows: GeneralAdmissionRow[] = []
      for (const item of gaItems) {
        const rows = await transaction<GeneralAdmissionRow[]>`
          select pool.ticket_type_id, type.name, type.price,
                 pool.capacity, pool.held, pool.sold
          from ticketing.inventory_pools pool
          join ticketing.ticket_types type
            on type.tenant_id = pool.tenant_id
           and type.id = pool.ticket_type_id
            where pool.tenant_id = ${session.tenant_id}
            and pool.event_id = ${session.event_id}
            and pool.ticket_type_id = ${item.ticketTypeId}
            and type.inventory_mode = 'GENERAL_ADMISSION'
          for update of pool
        `
        const row = rows[0]
        if (row === undefined) {
          throw new DomainError('NOT_FOUND', 'Ticket inventory was not found')
        }
        if (row.capacity - row.held - row.sold < item.quantity) {
          throw new DomainError('INSUFFICIENT_INVENTORY', 'Ticket inventory is no longer available', {
            details: { ticketTypeId: item.ticketTypeId },
          })
        }
        gaRows.push(row)
      }

      const seatRows = seatIds.length === 0
        ? []
        : await transaction<SeatRow[]>`
            select event_seat.id, event_seat.ticket_type_id, event_seat.status,
                   ticket_type.name,
                   coalesce(event_seat.price_override, ticket_type.price)::integer as price,
                   venue_seat.row_label, venue_seat.seat_number
            from ticketing.event_seats event_seat
            join ticketing.ticket_types ticket_type
              on ticket_type.tenant_id = event_seat.tenant_id
             and ticket_type.id = event_seat.ticket_type_id
            join ticketing.venue_seats venue_seat
              on venue_seat.tenant_id = event_seat.tenant_id
             and venue_seat.id = event_seat.venue_seat_id
            where event_seat.tenant_id = ${session.tenant_id}
              and event_seat.event_id = ${session.event_id}
              and event_seat.id in ${transaction(seatIds)}
              and ticket_type.inventory_mode = 'ASSIGNED_SEAT'
            order by event_seat.id
            for update of event_seat
          `

      if (seatRows.length !== seatIds.length || seatRows.some((seat) => seat.status !== 'AVAILABLE')) {
        throw new DomainError('INSUFFICIENT_INVENTORY', 'One or more seats are no longer available')
      }

      const pricedItems = [
        ...gaItems.map((item) => {
          const row = gaRows.find((candidate) => candidate.ticket_type_id === item.ticketTypeId)
          if (row === undefined) throw new DomainError('NOT_FOUND', 'Ticket type was not found')
          return {
            referenceId: row.ticket_type_id,
            label: row.name,
            unitPrice: row.price,
            quantity: item.quantity,
          }
        }),
        ...seatRows.map((seat) => ({
          referenceId: seat.id,
          label: `${seat.name} · ${seat.row_label}-${seat.seat_number}`,
          unitPrice: seat.price,
          quantity: 1,
        })),
      ]
      const quote = calculatePriceQuote(pricedItems, session.service_fee_basis_points)

      const reservations = await transaction<{ expires_at: Date }[]>`
        insert into ticketing.reservations (
          id, tenant_id, sales_session_id, admission_entry_id, event_id, user_id, status,
          expires_at, subtotal, service_fee, total, currency
        ) values (
          ${reservationId}, ${session.tenant_id}, ${command.salesSessionId},
          ${command.admissionEntryId},
          ${session.event_id}, ${command.userId}, 'HELD',
          now() + make_interval(secs => ${session.hold_duration_seconds}),
          ${quote.subtotal}, ${quote.serviceFee}, ${quote.total}, 'IDR'
        )
        returning expires_at
      `
      const reservation = reservations[0]
      if (reservation === undefined) throw new DomainError('CONFLICT', 'Reservation was not created')

      for (const item of gaItems) {
        const row = gaRows.find((candidate) => candidate.ticket_type_id === item.ticketTypeId)
        if (row === undefined) throw new DomainError('NOT_FOUND', 'Ticket type was not found')
        await transaction`
          update ticketing.inventory_pools
          set held = held + ${item.quantity}, version = version + 1, updated_at = now()
          where tenant_id = ${session.tenant_id} and ticket_type_id = ${item.ticketTypeId}
        `
        await transaction`
          insert into ticketing.reservation_items (
            tenant_id, reservation_id, kind, ticket_type_id,
            quantity, unit_price, label
          ) values (
            ${session.tenant_id}, ${reservationId}, 'GENERAL_ADMISSION',
            ${item.ticketTypeId}, ${item.quantity}, ${row.price}, ${row.name}
          )
        `
      }

      for (const seat of seatRows) {
        await transaction`
          update ticketing.event_seats
          set status = 'HELD', reservation_id = ${reservationId},
              hold_expires_at = ${reservation.expires_at}, version = version + 1,
              updated_at = now()
          where tenant_id = ${session.tenant_id}
            and id = ${seat.id}
            and status = 'AVAILABLE'
        `
        await transaction`
          insert into ticketing.reservation_items (
            tenant_id, reservation_id, kind, ticket_type_id, event_seat_id,
            quantity, unit_price, label
          ) values (
            ${session.tenant_id}, ${reservationId}, 'ASSIGNED_SEAT',
            ${seat.ticket_type_id}, ${seat.id}, 1, ${seat.price},
            ${`${seat.name} · ${seat.row_label}-${seat.seat_number}`}
          )
        `
      }

      await transaction`
        insert into ticketing.audit_log (
          tenant_id, actor_user_id, action, aggregate_type, aggregate_id, metadata
        ) values (
          ${session.tenant_id}, ${command.userId}, 'RESERVATION_CREATED',
          'reservation', ${reservationId},
          ${transaction.json({ ticketCount: requestedCount, expiresAt: reservation.expires_at })}
        )
      `

      return {
        id: reservationId,
        status: 'HELD',
        expiresAt: reservation.expires_at.toISOString(),
        subtotal: quote.subtotal,
        serviceFee: quote.serviceFee,
        total: quote.total,
        currency: 'IDR',
      }
    })
  }
}
