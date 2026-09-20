import type { MidtransNotification } from '@war-ticket/contracts'
import { DomainError } from '@war-ticket/domain'
import type { DatabaseClient } from './client'

export type EdgeOrderStatus =
  | 'HELD'
  | 'PAID'
  | 'FAILED'
  | 'EXPIRED'
  | 'PAYMENT_REVIEW_REQUIRED'

export interface EdgeTierQuote {
  readonly tierId: string
  readonly tierName: string
  readonly unitPrice: number
  readonly quantity: number
  readonly amount: number
  readonly available: number
}

export interface EdgeHoldOrder {
  readonly id: string
  readonly userId: string
  readonly eventId: string
  readonly tierId: string
  readonly idempotencyKey: string
  readonly requestHash: string
  readonly providerOrderId: string
  readonly quantity: number
  readonly unitPrice: number
  readonly amount: number
  readonly holdExpiresAt: Date
}

export interface EdgePaymentContext {
  readonly orderId: string
  readonly userId: string
  readonly eventId: string
  readonly tierId: string
  readonly providerOrderId: string
  readonly quantity: number
  readonly amount: number
  readonly status: EdgeOrderStatus
}

interface EdgeOrderRow {
  readonly id: string
  readonly user_id: string
  readonly event_id: string
  readonly tier_id: string
  readonly idempotency_key: string
  readonly request_hash: string
  readonly provider_order_id: string
  readonly quantity: number
  readonly unit_price: number
  readonly amount: number
  readonly status: EdgeOrderStatus
  readonly hold_expires_at: Date
}

export class EdgeCheckoutRepository {
  constructor(
    private readonly sql: DatabaseClient,
    private readonly supabaseFallback?: any
  ) {}

  async getEventAvailability(eventId: string): Promise<number> {
    try {
      const rows = await this.sql<{ available: number; tier_count: number }[]>`
        select coalesce(sum(greatest(capacity - sold, 0)), 0)::integer as available,
               count(*)::integer as tier_count
        from public.ticket_tiers
        where concert_id = ${eventId}
      `
      const row = rows[0]
      if (row === undefined || row.tier_count === 0) {
        throw new DomainError('NOT_FOUND', 'Event inventory was not found')
      }
      return row.available
    } catch (err: any) {
      if (err instanceof DomainError) throw err
      if (this.supabaseFallback) {
        const { data, error } = await this.supabaseFallback
          .from('ticket_tiers')
          .select('capacity, sold')
          .eq('concert_id', eventId)
        if (!error && data && data.length > 0) {
          return data.reduce((acc: number, t: any) => acc + Math.max(t.capacity - t.sold, 0), 0)
        }
      }
      throw err
    }
  }

  async getTierQuote(input: {
    eventId: string
    tierId?: string
    quantity: number
  }): Promise<EdgeTierQuote> {
    try {
      const rows = await this.sql<{
        id: string
        name: string
        price: number
        available: number
      }[]>`
        select id, name, price, greatest(capacity - sold, 0)::integer as available
        from public.ticket_tiers
        where concert_id = ${input.eventId}
          and (${input.tierId ?? null}::uuid is null or id = ${input.tierId ?? null})
        order by sort_order, id
        limit 2
      `
      if (rows.length === 0) throw new DomainError('NOT_FOUND', 'Ticket tier was not found')
      if (input.tierId === undefined && rows.length !== 1) {
        throw new DomainError('VALIDATION_ERROR', 'tierId is required when an event has multiple tiers')
      }
      const tier = rows[0]
      if (tier === undefined) throw new DomainError('NOT_FOUND', 'Ticket tier was not found')
      const amount = tier.price * input.quantity
      if (!Number.isSafeInteger(amount)) {
        throw new DomainError('VALIDATION_ERROR', 'Order amount exceeds the safe integer range')
      }
      return {
        tierId: tier.id,
        tierName: tier.name,
        unitPrice: tier.price,
        quantity: input.quantity,
        amount,
        available: tier.available,
      }
    } catch (err: any) {
      if (err instanceof DomainError) throw err
      if (this.supabaseFallback) {
        let query = this.supabaseFallback
          .from('ticket_tiers')
          .select('id, name, price, capacity, sold, sort_order')
          .eq('concert_id', input.eventId)
        if (input.tierId) {
          query = query.eq('id', input.tierId)
        }
        const { data, error } = await query.order('sort_order').limit(2)
        if (!error && data && data.length > 0) {
          if (input.tierId === undefined && data.length !== 1) {
            throw new DomainError('VALIDATION_ERROR', 'tierId is required when an event has multiple tiers')
          }
          const tier = data[0]
          const available = Math.max(tier.capacity - tier.sold, 0)
          const amount = tier.price * input.quantity
          if (!Number.isSafeInteger(amount)) {
            throw new DomainError('VALIDATION_ERROR', 'Order amount exceeds the safe integer range')
          }
          return {
            tierId: tier.id,
            tierName: tier.name,
            unitPrice: tier.price,
            quantity: input.quantity,
            amount,
            available,
          }
        }
      }
      throw err
    }
  }

  async upsertHoldOrder(order: EdgeHoldOrder): Promise<void> {
    try {
      await this.sql.begin(async (transaction) => {
        await transaction`
          insert into ticketing.edge_orders (
            id, user_id, event_id, tier_id, idempotency_key, request_hash,
            provider_order_id, quantity, unit_price, amount, hold_expires_at
          ) values (
            ${order.id}, ${order.userId}, ${order.eventId}, ${order.tierId},
            ${order.idempotencyKey}, ${order.requestHash}, ${order.providerOrderId},
            ${order.quantity}, ${order.unitPrice}, ${order.amount}, ${order.holdExpiresAt}
          )
          on conflict do nothing
        `
        const rows = await transaction<EdgeOrderRow[]>`
          select id, user_id, event_id, tier_id, idempotency_key, request_hash,
                 provider_order_id, quantity, unit_price, amount, status, hold_expires_at
          from ticketing.edge_orders
          where id = ${order.id}
          for update
        `
        const stored = rows[0]
        if (
          stored === undefined ||
          stored.user_id !== order.userId ||
          stored.event_id !== order.eventId ||
          stored.tier_id !== order.tierId ||
          stored.idempotency_key !== order.idempotencyKey ||
          stored.request_hash !== order.requestHash ||
          stored.quantity !== order.quantity ||
          stored.unit_price !== order.unitPrice ||
          stored.amount !== order.amount
        ) {
          throw new DomainError('IDEMPOTENCY_CONFLICT', 'Stored edge order does not match the hold')
        }
      })
    } catch (err: any) {
      if (err instanceof DomainError) throw err
      if (this.supabaseFallback) {
        try {
          await this.supabaseFallback.schema('ticketing').from('edge_orders').upsert({
            id: order.id,
            user_id: order.userId,
            event_id: order.eventId,
            tier_id: order.tierId,
            idempotency_key: order.idempotencyKey,
            request_hash: order.requestHash,
            provider_order_id: order.providerOrderId,
            quantity: order.quantity,
            unit_price: order.unitPrice,
            amount: order.amount,
            hold_expires_at: order.holdExpiresAt.toISOString(),
          })
          return
        } catch {
          // ignore fallback schema error
        }
      }
      console.warn('[EdgeCheckoutRepository] Async SQL sync failed (Redis hold remains authoritative):', err.message)
    }
  }

  async getPaymentContext(orderId: string): Promise<EdgePaymentContext> {
    const rows = await this.sql<EdgeOrderRow[]>`
      select id, user_id, event_id, tier_id, idempotency_key, request_hash,
             provider_order_id, quantity, unit_price, amount, status, hold_expires_at
      from ticketing.edge_orders
      where id = ${orderId}
    `
    const row = rows[0]
    if (row === undefined) throw new DomainError('NOT_FOUND', 'Edge order was not found')
    return {
      orderId: row.id,
      userId: row.user_id,
      eventId: row.event_id,
      tierId: row.tier_id,
      providerOrderId: row.provider_order_id,
      quantity: row.quantity,
      amount: row.amount,
      status: row.status,
    }
  }

  async recordNotification(
    orderId: string,
    notification: MidtransNotification,
  ): Promise<boolean> {
    const providerEventKey = [
      notification.transaction_id,
      notification.transaction_status,
      notification.status_code,
    ].join(':')
    const rows = await this.sql<{ id: string }[]>`
      insert into ticketing.edge_payment_inbox (
        order_id, provider_event_key, payload
      ) values (
        ${orderId}, ${providerEventKey}, ${JSON.stringify(notification)}::jsonb
      )
      on conflict (provider_event_key) do nothing
      returning id
    `
    return rows.length === 1
  }

  async markPaid(context: EdgePaymentContext, transactionId: string): Promise<EdgeOrderStatus> {
    return this.sql.begin(async (transaction) => {
      const rows = await transaction<{ status: EdgeOrderStatus }[]>`
        select status from ticketing.edge_orders where id = ${context.orderId} for update
      `
      const current = rows[0]?.status
      if (current === undefined) throw new DomainError('NOT_FOUND', 'Edge order was not found')
      if (current === 'PAID' || current === 'PAYMENT_REVIEW_REQUIRED') return current
      if (current !== 'HELD') {
        await transaction`
          update ticketing.edge_orders
          set status = 'PAYMENT_REVIEW_REQUIRED',
              provider_transaction_id = ${transactionId}, updated_at = now()
          where id = ${context.orderId}
        `
        return 'PAYMENT_REVIEW_REQUIRED'
      }

      const inventory = await transaction`
        update public.ticket_tiers
        set sold = sold + ${context.quantity}
        where id = ${context.tierId}
          and concert_id = ${context.eventId}
          and capacity - sold >= ${context.quantity}
        returning id
      `
      if (inventory.length !== 1) {
        await transaction`
          update ticketing.edge_orders
          set status = 'PAYMENT_REVIEW_REQUIRED',
              provider_transaction_id = ${transactionId}, updated_at = now()
          where id = ${context.orderId}
        `
        return 'PAYMENT_REVIEW_REQUIRED'
      }
      await transaction`
        update ticketing.edge_orders
        set status = 'PAID', provider_transaction_id = ${transactionId},
            paid_at = now(), updated_at = now()
        where id = ${context.orderId}
      `
      return 'PAID'
    })
  }

  async markFailed(orderId: string, transactionId: string): Promise<void> {
    await this.sql`
      update ticketing.edge_orders
      set status = 'FAILED', provider_transaction_id = ${transactionId}, updated_at = now()
      where id = ${orderId} and status = 'HELD'
    `
  }

  async markReviewRequired(orderId: string, transactionId: string): Promise<void> {
    await this.sql`
      update ticketing.edge_orders
      set status = 'PAYMENT_REVIEW_REQUIRED',
          provider_transaction_id = ${transactionId}, updated_at = now()
      where id = ${orderId} and status <> 'PAID'
    `
  }

  async markExpired(orderIds: readonly string[]): Promise<void> {
    if (orderIds.length === 0) return
    await this.sql`
      update ticketing.edge_orders set status = 'EXPIRED', updated_at = now()
      where id in ${this.sql(orderIds)} and status = 'HELD'
    `
  }

  async markNotificationProcessed(orderId: string, notification: MidtransNotification): Promise<void> {
    const providerEventKey = [
      notification.transaction_id,
      notification.transaction_status,
      notification.status_code,
    ].join(':')
    await this.sql`
      update ticketing.edge_payment_inbox set processed_at = now()
      where order_id = ${orderId} and provider_event_key = ${providerEventKey}
    `
  }
}
