import { createHash, randomUUID } from 'node:crypto'
import {
  checkoutResponseSchema,
  type BuyerDetails,
  type CheckoutResponse,
} from '@war-ticket/contracts'
import { DomainError } from '@war-ticket/domain'
import type { DatabaseClient } from './client'
import type { EnvelopeCipher } from './encryption'

interface CheckoutCommand {
  readonly reservationId: string
  readonly userId: string
  readonly idempotencyKey: string
  readonly buyer: BuyerDetails
}

interface ReservationRow {
  readonly id: string
  readonly tenant_id: string
  readonly user_id: string
  readonly status: string
  readonly expires_at: Date
  readonly subtotal: number
  readonly service_fee: number
  readonly total: number
  readonly currency: 'IDR'
}

interface IdempotencyRow {
  readonly request_hash: string
  readonly response_body: unknown
}

function stableHash(input: unknown): string {
  return createHash('sha256').update(JSON.stringify(input)).digest('hex')
}

export class CheckoutRepository {
  constructor(
    private readonly sql: DatabaseClient,
    private readonly cipher: EnvelopeCipher,
  ) {}

  async createCheckout(command: CheckoutCommand): Promise<CheckoutResponse> {
    const requestHash = stableHash({ reservationId: command.reservationId, buyer: command.buyer })

    return this.sql.begin(async (transaction) => {
      await transaction`set local lock_timeout = '2s'`
      await transaction`set local statement_timeout = '5s'`

      const reservations = await transaction<ReservationRow[]>`
        select id, tenant_id, user_id, status, expires_at,
               subtotal, service_fee, total, currency
        from ticketing.reservations
        where id = ${command.reservationId}
        for update
      `
      const reservation = reservations[0]
      if (reservation === undefined) throw new DomainError('NOT_FOUND', 'Reservation was not found')
      if (reservation.user_id !== command.userId) throw new DomainError('FORBIDDEN', 'Reservation is owned by another user')

      const claimed = await transaction<{ key: string }[]>`
        insert into ticketing.idempotency_keys (
          tenant_id, user_id, scope, key, request_hash,
          locked_until, expires_at
        ) values (
          ${reservation.tenant_id}, ${command.userId}, 'checkout',
          ${command.idempotencyKey}, ${requestHash}, now() + interval '30 seconds',
          now() + interval '24 hours'
        )
        on conflict do nothing
        returning key
      `

      if (claimed.length === 0) {
        const existingRows = await transaction<IdempotencyRow[]>`
          select request_hash, response_body
          from ticketing.idempotency_keys
          where tenant_id = ${reservation.tenant_id}
            and user_id = ${command.userId}
            and scope = 'checkout'
            and key = ${command.idempotencyKey}
          for update
        `
        const existing = existingRows[0]
        if (existing === undefined || existing.request_hash !== requestHash) {
          throw new DomainError('IDEMPOTENCY_CONFLICT', 'Idempotency key was used for another request')
        }
        if (existing.response_body !== null) return checkoutResponseSchema.parse(existing.response_body)
        throw new DomainError('CONFLICT', 'Checkout is already being processed', { retryable: true })
      }

      if (reservation.status !== 'HELD' || reservation.expires_at.getTime() <= Date.now()) {
        throw new DomainError('RESERVATION_EXPIRED', 'Reservation is no longer active')
      }

      const orderId = randomUUID()
      const providerOrderId = `WT-${orderId.replaceAll('-', '')}`
      const paymentAttemptId = randomUUID()

      await transaction`
        insert into ticketing.orders (
          id, tenant_id, reservation_id, user_id, status, provider_order_id,
          buyer_name, buyer_email_ciphertext, buyer_phone_ciphertext,
          buyer_nik_ciphertext, buyer_nik_consent_at, buyer_nik_retention_until,
          subtotal, service_fee, total, currency
        ) values (
          ${orderId}, ${reservation.tenant_id}, ${reservation.id}, ${command.userId},
          'PENDING_PAYMENT', ${providerOrderId}, ${command.buyer.fullName},
          ${this.cipher.encrypt(command.buyer.email)},
          ${this.cipher.encrypt(command.buyer.phone)},
          ${command.buyer.nik === undefined ? null : this.cipher.encrypt(command.buyer.nik)},
          ${command.buyer.nik === undefined ? null : new Date()},
          ${command.buyer.nik === undefined
            ? null
            : new Date(Date.now() + 180 * 24 * 60 * 60 * 1_000)},
          ${reservation.subtotal}, ${reservation.service_fee}, ${reservation.total},
          ${reservation.currency}
        )
      `

      await transaction`
        insert into ticketing.order_items (
          tenant_id, order_id, ticket_type_id, event_seat_id,
          quantity, unit_price, label
        )
        select tenant_id, ${orderId}, ticket_type_id, event_seat_id,
               quantity, unit_price, label
        from ticketing.reservation_items
        where tenant_id = ${reservation.tenant_id}
          and reservation_id = ${reservation.id}
      `

      await transaction`
        insert into ticketing.payment_attempts (
          id, tenant_id, order_id, provider, provider_order_id,
          status, amount, currency
        ) values (
          ${paymentAttemptId}, ${reservation.tenant_id}, ${orderId}, 'MIDTRANS',
          ${providerOrderId}, 'INITIATING', ${reservation.total}, ${reservation.currency}
        )
      `

      await transaction`
        update ticketing.reservations
        set status = 'CHECKOUT_PENDING', updated_at = now()
        where id = ${reservation.id}
      `

      await transaction`
        insert into ticketing.outbox (
          tenant_id, topic, aggregate_type, aggregate_id, payload
        ) values (
          ${reservation.tenant_id}, 'payment.create', 'payment_attempt',
          ${paymentAttemptId},
          ${transaction.json({ paymentAttemptId, orderId, providerOrderId })}
        )
      `

      const response: CheckoutResponse = {
        orderId,
        orderStatus: 'PENDING_PAYMENT',
        paymentStatus: 'INITIATING',
        paymentToken: null,
        redirectUrl: null,
        retryAfterMs: 500,
      }
      await transaction`
        update ticketing.idempotency_keys
        set response_status = 202,
            response_body = ${transaction.json(response)},
            locked_until = now()
        where tenant_id = ${reservation.tenant_id}
          and user_id = ${command.userId}
          and scope = 'checkout'
          and key = ${command.idempotencyKey}
      `
      await transaction`
        insert into ticketing.audit_log (
          tenant_id, actor_user_id, action, aggregate_type, aggregate_id, metadata
        ) values (
          ${reservation.tenant_id}, ${command.userId}, 'CHECKOUT_CREATED',
          'order', ${orderId}, ${transaction.json({
            reservationId: reservation.id,
            nikProvided: command.buyer.nik !== undefined,
          })}
        )
      `
      return response
    })
  }
}
