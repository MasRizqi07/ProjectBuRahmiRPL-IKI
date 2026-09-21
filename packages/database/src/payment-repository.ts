import type { CheckoutResponse, MidtransNotification, PaymentStatus } from '@war-ticket/contracts'
import { DomainError, mapMidtransStatus } from '@war-ticket/domain'
import type { MidtransLineItem, MidtransPaymentRequest } from '@war-ticket/payments'
import type postgres from 'postgres'
import type { DatabaseClient } from './client'
import type { EnvelopeCipher } from './encryption'

interface PaymentCreationRow {
  readonly payment_attempt_id: string
  readonly tenant_id: string
  readonly environment: 'SANDBOX' | 'PRODUCTION'
  readonly encrypted_server_key: Uint8Array
  readonly provider_order_id: string
  readonly amount: number
  readonly buyer_name: string
  readonly buyer_email_ciphertext: Uint8Array
  readonly buyer_phone_ciphertext: Uint8Array
  readonly expires_at: Date
}

interface PaymentItemRow {
  readonly ticket_type_id: string
  readonly label: string
  readonly unit_price: number
  readonly quantity: number
}

interface NotificationContextRow {
  readonly tenant_id: string
  readonly payment_attempt_id: string
  readonly environment: 'SANDBOX' | 'PRODUCTION'
  readonly encrypted_server_key: Uint8Array
}

interface EdgeNotificationContextRow {
  readonly edge_order_id: string
  readonly tenant_id: string
  readonly user_id: string
  readonly event_id: string
  readonly tier_id: string
  readonly quantity: number
  readonly amount: number
  readonly status: string
  readonly environment: 'SANDBOX' | 'PRODUCTION'
  readonly encrypted_server_key: Uint8Array
}

interface LockedPaymentRow {
  readonly payment_attempt_id: string
  readonly payment_status: PaymentStatus
  readonly order_id: string
  readonly order_status: string
  readonly reservation_id: string
  readonly reservation_status: string
  readonly expires_at: Date
  readonly tenant_id: string
  readonly user_id: string
}

interface GeneralAdmissionHeldRow {
  readonly ticket_type_id: string
  readonly quantity: number
}

const terminalPaymentStatuses = new Set<PaymentStatus>([
  'SUCCEEDED',
  'DENIED',
  'EXPIRED',
  'CANCELLED',
  'REFUNDED',
])

export interface PaymentCreationContext {
  readonly attemptId: string
  readonly tenantId: string
  readonly serverKey: string
  readonly production: boolean
  readonly request: MidtransPaymentRequest
}

export interface LegacyNotificationContext {
  readonly isEdge?: false
  readonly tenantId: string
  readonly paymentAttemptId: string
  readonly serverKey: string
  readonly production: boolean
}

export interface EdgeNotificationContext {
  readonly isEdge: true
  readonly tenantId: string
  readonly edgeOrderId: string
  readonly userId: string
  readonly eventId: string
  readonly tierId: string
  readonly quantity: number
  readonly amount: number
  readonly status: string
  readonly serverKey: string
  readonly production: boolean
  readonly paymentAttemptId?: string
}

export type NotificationContext = LegacyNotificationContext | EdgeNotificationContext

export interface PaymentManagementContext {
  readonly providerOrderId: string
  readonly serverKey: string
  readonly production: boolean
}

export interface RefundContext extends PaymentManagementContext {
  readonly orderId: string
  readonly paymentAttemptId: string
  readonly providerTransactionId: string | null
  readonly amount: number
  readonly orderStatus: string
}

export class PaymentRepository {
  constructor(
    private readonly sql: DatabaseClient,
    private readonly cipher: EnvelopeCipher,
  ) {}

  async getCreationContext(paymentAttemptId: string): Promise<PaymentCreationContext> {
    const rows = await this.sql<PaymentCreationRow[]>`
      select payment.id as payment_attempt_id, payment.tenant_id,
             merchant.environment, merchant.encrypted_server_key,
             payment.provider_order_id, payment.amount,
             orders.buyer_name, orders.buyer_email_ciphertext,
             orders.buyer_phone_ciphertext, reservation.expires_at
      from ticketing.payment_attempts payment
      join ticketing.orders orders
        on orders.tenant_id = payment.tenant_id and orders.id = payment.order_id
      join ticketing.reservations reservation
        on reservation.tenant_id = orders.tenant_id and reservation.id = orders.reservation_id
      join ticketing.merchant_configs merchant
        on merchant.tenant_id = payment.tenant_id
       and merchant.provider = payment.provider
       and merchant.enabled = true
      where payment.id = ${paymentAttemptId}
        and payment.status in ('INITIATING', 'UNKNOWN')
    `
    const row = rows[0]
    if (row === undefined) throw new DomainError('NOT_FOUND', 'Payment attempt is not ready for initiation')

    const items = await this.sql<PaymentItemRow[]>`
      select item.ticket_type_id, item.label, item.unit_price, item.quantity
      from ticketing.payment_attempts payment
      join ticketing.order_items item
        on item.tenant_id = payment.tenant_id and item.order_id = payment.order_id
      where payment.id = ${paymentAttemptId}
      order by item.id
    `
    const midtransItems: MidtransLineItem[] = items.map((item) => ({
      id: item.ticket_type_id,
      name: item.label.slice(0, 50),
      price: item.unit_price,
      quantity: item.quantity,
    }))
    const itemTotal = midtransItems.reduce((sum, item) => sum + item.price * item.quantity, 0)
    if (itemTotal < row.amount) {
      midtransItems.push({
        id: 'platform-service-fee',
        name: 'War Ticket Service Fee',
        price: row.amount - itemTotal,
        quantity: 1,
      })
    }

    return {
      attemptId: row.payment_attempt_id,
      tenantId: row.tenant_id,
      serverKey: this.cipher.decrypt(row.encrypted_server_key),
      production: row.environment === 'PRODUCTION',
      request: {
        providerOrderId: row.provider_order_id,
        amount: row.amount,
        customer: {
          name: row.buyer_name,
          email: this.cipher.decrypt(row.buyer_email_ciphertext),
          phone: this.cipher.decrypt(row.buyer_phone_ciphertext),
        },
        items: midtransItems,
        expiresInSeconds: Math.max(
          60,
          Math.min(1_800, Math.floor((row.expires_at.getTime() - Date.now()) / 1_000)),
        ),
      },
    }
  }

  async markReady(input: {
    paymentAttemptId: string
    token: string
    redirectUrl: string
  }): Promise<void> {
    const result = await this.sql`
      update ticketing.payment_attempts
      set status = 'PENDING', payment_token_ciphertext = ${this.cipher.encrypt(input.token)},
          redirect_url = ${input.redirectUrl}, updated_at = now(), failure_code = null
      where id = ${input.paymentAttemptId} and status in ('INITIATING', 'UNKNOWN')
      returning id
    `
    if (result.length === 0) throw new DomainError('INVALID_STATE_TRANSITION', 'Payment is no longer initiating')
  }

  async markInitiationUnknown(paymentAttemptId: string, failureCode: string): Promise<void> {
    await this.sql`
      update ticketing.payment_attempts
      set status = 'UNKNOWN', failure_code = ${failureCode.slice(0, 200)}, updated_at = now()
      where id = ${paymentAttemptId} and status = 'INITIATING'
    `
  }

  async getManagementContext(paymentAttemptId: string): Promise<PaymentManagementContext> {
    const rows = await this.sql<{
      provider_order_id: string
      environment: 'SANDBOX' | 'PRODUCTION'
      encrypted_server_key: Uint8Array
    }[]>`
      select payment.provider_order_id, merchant.environment,
             merchant.encrypted_server_key
      from ticketing.payment_attempts payment
      join ticketing.merchant_configs merchant
        on merchant.tenant_id = payment.tenant_id
       and merchant.provider = payment.provider
      where payment.id = ${paymentAttemptId}
    `
    const row = rows[0]
    if (row === undefined) throw new DomainError('NOT_FOUND', 'Payment attempt was not found')
    return {
      providerOrderId: row.provider_order_id,
      serverKey: this.cipher.decrypt(row.encrypted_server_key),
      production: row.environment === 'PRODUCTION',
    }
  }

  async getRefundContext(orderId: string): Promise<RefundContext> {
    const rows = await this.sql<Array<{
      order_id: string
      payment_attempt_id: string
      provider_order_id: string
      provider_transaction_id: string | null
      amount: number
      order_status: string
      environment: 'SANDBOX' | 'PRODUCTION'
      encrypted_server_key: Uint8Array
    }>>`
      select orders.id as order_id, payment.id as payment_attempt_id,
             payment.provider_order_id, payment.provider_transaction_id,
             payment.amount, orders.status as order_status,
             merchant.environment, merchant.encrypted_server_key
      from ticketing.orders orders
      join lateral (
        select * from ticketing.payment_attempts
        where tenant_id = orders.tenant_id and order_id = orders.id
        order by created_at desc limit 1
      ) payment on true
      join ticketing.merchant_configs merchant
        on merchant.tenant_id = payment.tenant_id and merchant.provider = payment.provider and merchant.enabled = true
      where orders.id = ${orderId}
    `
    const row = rows[0]
    if (!row) throw new DomainError('NOT_FOUND', 'Refundable payment was not found or merchant is disabled')
    return {
      orderId: row.order_id,
      paymentAttemptId: row.payment_attempt_id,
      providerOrderId: row.provider_order_id,
      providerTransactionId: row.provider_transaction_id,
      amount: row.amount,
      orderStatus: row.order_status,
      serverKey: this.cipher.decrypt(row.encrypted_server_key),
      production: row.environment === 'PRODUCTION',
    }
  }

  async getCheckoutStatus(orderId: string, userId: string): Promise<CheckoutResponse> {
    const rows = await this.sql<{
      order_id: string
      order_status: CheckoutResponse['orderStatus']
      payment_status: CheckoutResponse['paymentStatus']
      payment_token_ciphertext: Uint8Array | null
      redirect_url: string | null
    }[]>`
      select orders.id as order_id, orders.status as order_status,
             payment.status as payment_status,
             payment.payment_token_ciphertext, payment.redirect_url
      from ticketing.orders orders
      join lateral (
        select status, payment_token_ciphertext, redirect_url
        from ticketing.payment_attempts
        where tenant_id = orders.tenant_id and order_id = orders.id
        order by created_at desc limit 1
      ) payment on true
      where orders.id = ${orderId} and orders.user_id = ${userId}
    `
    const row = rows[0]
    if (row === undefined) throw new DomainError('NOT_FOUND', 'Order was not found')
    const ready = row.payment_status !== 'INITIATING' && row.payment_status !== 'UNKNOWN'
    return {
      orderId: row.order_id,
      orderStatus: row.order_status,
      paymentStatus: row.payment_status,
      paymentToken:
        row.payment_token_ciphertext === null
          ? null
          : this.cipher.decrypt(row.payment_token_ciphertext),
      redirectUrl: row.redirect_url,
      retryAfterMs: ready ? null : 500,
    }
  }

  async getNotificationContext(providerOrderId: string): Promise<NotificationContext> {
    if (providerOrderId.startsWith('WT-EDGE-')) {
      return this.getEdgeNotificationContext(providerOrderId)
    }

    const rows = await this.sql<NotificationContextRow[]>`
      select payment.tenant_id, payment.id as payment_attempt_id,
             merchant.environment, merchant.encrypted_server_key
      from ticketing.payment_attempts payment
      join ticketing.merchant_configs merchant
        on merchant.tenant_id = payment.tenant_id
       and merchant.provider = payment.provider
      where payment.provider = 'MIDTRANS'
        and payment.provider_order_id = ${providerOrderId}
    `
    const row = rows[0]
    if (row !== undefined) {
      return {
        isEdge: false,
        tenantId: row.tenant_id,
        paymentAttemptId: row.payment_attempt_id,
        serverKey: this.cipher.decrypt(row.encrypted_server_key),
        production: row.environment === 'PRODUCTION',
      }
    }

    return this.getEdgeNotificationContext(providerOrderId)
  }

  private async getEdgeNotificationContext(providerOrderId: string): Promise<EdgeNotificationContext> {
    const rows = await this.sql<EdgeNotificationContextRow[]>`
      select edge_order.id as edge_order_id, edge_order.tenant_id,
             edge_order.user_id, edge_order.event_id, edge_order.tier_id,
             edge_order.quantity, edge_order.amount, edge_order.status,
             merchant.environment, merchant.encrypted_server_key
      from ticketing.edge_orders edge_order
      join ticketing.merchant_configs merchant
        on merchant.tenant_id = edge_order.tenant_id
       and merchant.provider = 'MIDTRANS'
      where edge_order.provider_order_id = ${providerOrderId}
    `
    const row = rows[0]
    if (row === undefined) throw new DomainError('NOT_FOUND', 'Payment notification order was not found')
    return {
      isEdge: true,
      tenantId: row.tenant_id,
      edgeOrderId: row.edge_order_id,
      userId: row.user_id,
      eventId: row.event_id,
      tierId: row.tier_id,
      quantity: row.quantity,
      amount: row.amount,
      status: row.status,
      serverKey: this.cipher.decrypt(row.encrypted_server_key),
      production: row.environment === 'PRODUCTION',
    }
  }

  async applyNotification(notification: MidtransNotification): Promise<boolean> {
    const newStatus = mapMidtransStatus({
      transactionStatus: notification.transaction_status,
      ...(notification.fraud_status === undefined ? {} : { fraudStatus: notification.fraud_status }),
    })
    const providerEventKey = [
      notification.transaction_id,
      notification.transaction_status,
      notification.status_code,
    ].join(':')

    return this.sql.begin(async (transaction) => {
      const contextRows = await transaction<LockedPaymentRow[]>`
        select payment.id as payment_attempt_id, payment.status as payment_status,
               orders.id as order_id, orders.status as order_status,
               reservation.id as reservation_id, reservation.status as reservation_status,
               reservation.expires_at, payment.tenant_id, orders.user_id
        from ticketing.payment_attempts payment
        join ticketing.orders orders
          on orders.tenant_id = payment.tenant_id and orders.id = payment.order_id
        join ticketing.reservations reservation
          on reservation.tenant_id = orders.tenant_id and reservation.id = orders.reservation_id
        where payment.provider = 'MIDTRANS'
          and payment.provider_order_id = ${notification.order_id}
        for update of payment, orders, reservation
      `
      const context = contextRows[0]
      if (context === undefined) throw new DomainError('NOT_FOUND', 'Payment attempt was not found')

      const inserted = await transaction<{ id: string }[]>`
        insert into ticketing.payment_inbox (
          tenant_id, provider, provider_event_key, provider_order_id, payload
        ) values (
          ${context.tenant_id}, 'MIDTRANS', ${providerEventKey},
          ${notification.order_id}, ${JSON.stringify(notification)}::jsonb
        )
        on conflict (provider, provider_event_key) do nothing
        returning id
      `
      if (inserted.length === 0) return false

      const ignoreRegression =
        terminalPaymentStatuses.has(context.payment_status) &&
        !(context.payment_status === 'SUCCEEDED' && newStatus === 'REFUNDED')

      if (!ignoreRegression) {
        await transaction`
          update ticketing.payment_attempts
          set status = ${newStatus}::ticketing.payment_status,
              provider_transaction_id = ${notification.transaction_id},
              updated_at = now()
          where id = ${context.payment_attempt_id}
        `

        if (newStatus === 'SUCCEEDED') {
          const reservationIsActive =
            (context.reservation_status === 'HELD' || context.reservation_status === 'CHECKOUT_PENDING') &&
            context.expires_at.getTime() > Date.now()
          if (reservationIsActive) {
            await this.confirmInventory(transaction, context)
          } else {
            await transaction`
              update ticketing.orders
              set status = 'PAYMENT_REVIEW_REQUIRED', updated_at = now()
              where id = ${context.order_id}
            `
          }
        } else if (newStatus === 'REFUNDED') {
          await transaction`
            update ticketing.orders set status = 'REFUNDED', updated_at = now()
            where id = ${context.order_id} and status in ('PAID', 'PAYMENT_REVIEW_REQUIRED')
          `
        } else if (newStatus === 'EXPIRED' || newStatus === 'DENIED' || newStatus === 'CANCELLED') {
          await this.releaseInventory(
            transaction,
            context,
            newStatus === 'EXPIRED' ? 'EXPIRED' : 'RELEASED',
          )
        }
      }

      await transaction`
        update ticketing.payment_inbox
        set processed_at = now()
        where provider = 'MIDTRANS' and provider_event_key = ${providerEventKey}
      `
      return true
    })
  }

  private async confirmInventory(
    transaction: postgres.TransactionSql,
    context: LockedPaymentRow,
  ): Promise<void> {
    const gaRows = await transaction<GeneralAdmissionHeldRow[]>`
      select ticket_type_id, sum(quantity)::integer as quantity
      from ticketing.reservation_items
      where tenant_id = ${context.tenant_id}
        and reservation_id = ${context.reservation_id}
        and kind = 'GENERAL_ADMISSION'
      group by ticket_type_id
      order by ticket_type_id
    `
    for (const item of gaRows) {
      const updated = await transaction`
        update ticketing.inventory_pools
        set held = held - ${item.quantity}, sold = sold + ${item.quantity},
            version = version + 1, updated_at = now()
        where tenant_id = ${context.tenant_id}
          and ticket_type_id = ${item.ticket_type_id}
          and held >= ${item.quantity}
        returning ticket_type_id
      `
      if (updated.length !== 1) throw new DomainError('CONFLICT', 'Inventory confirmation invariant failed')
    }
    await transaction`
      update ticketing.event_seats
      set status = 'SOLD', reservation_id = null, hold_expires_at = null,
          version = version + 1, updated_at = now()
      where tenant_id = ${context.tenant_id}
        and reservation_id = ${context.reservation_id}
        and status = 'HELD'
    `
    await transaction`
      update ticketing.reservations set status = 'CONFIRMED', updated_at = now()
      where id = ${context.reservation_id}
    `
    await transaction`
      update ticketing.orders set status = 'PAID', updated_at = now()
      where id = ${context.order_id}
    `
  }

  private async releaseInventory(
    transaction: postgres.TransactionSql,
    context: LockedPaymentRow,
    reservationStatus: 'EXPIRED' | 'RELEASED',
  ): Promise<void> {
    if (context.reservation_status !== 'HELD' && context.reservation_status !== 'CHECKOUT_PENDING') return
    const gaRows = await transaction<GeneralAdmissionHeldRow[]>`
      select ticket_type_id, sum(quantity)::integer as quantity
      from ticketing.reservation_items
      where tenant_id = ${context.tenant_id}
        and reservation_id = ${context.reservation_id}
        and kind = 'GENERAL_ADMISSION'
      group by ticket_type_id
      order by ticket_type_id
    `
    for (const item of gaRows) {
      await transaction`
        update ticketing.inventory_pools
        set held = held - ${item.quantity}, version = version + 1, updated_at = now()
        where tenant_id = ${context.tenant_id}
          and ticket_type_id = ${item.ticket_type_id}
          and held >= ${item.quantity}
      `
    }
    await transaction`
      update ticketing.event_seats
      set status = 'AVAILABLE', reservation_id = null, hold_expires_at = null,
          version = version + 1, updated_at = now()
      where tenant_id = ${context.tenant_id}
        and reservation_id = ${context.reservation_id}
        and status = 'HELD'
    `
    await transaction`
      update ticketing.reservations
      set status = ${reservationStatus}::ticketing.reservation_status, updated_at = now()
      where id = ${context.reservation_id}
    `
    await transaction`
      update ticketing.orders
      set status = ${reservationStatus === 'EXPIRED' ? 'EXPIRED' : 'CANCELLED'}::ticketing.order_status,
          updated_at = now()
      where id = ${context.order_id} and status = 'PENDING_PAYMENT'
    `
  }
}
