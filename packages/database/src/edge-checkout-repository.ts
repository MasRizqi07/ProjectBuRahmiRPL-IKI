import type { MidtransNotification } from '@war-ticket/contracts'
import { DomainError } from '@war-ticket/domain'
import { createLogger } from '@war-ticket/observability'
import type { DatabaseClient } from './client'

const logger = createLogger({ component: 'EdgeCheckoutRepository' })

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error)
}

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

interface SupabaseError {
  readonly message: string
}

interface SupabaseResult<T> {
  readonly data: readonly T[] | null
  readonly error: SupabaseError | null
}

interface SupabaseQuery<T> extends PromiseLike<SupabaseResult<T>> {
  eq(column: string, value: string): SupabaseQuery<T>
  order(column: string): SupabaseQuery<T>
  limit(count: number): PromiseLike<SupabaseResult<T>>
}

interface SupabaseTierInventoryRow {
  readonly capacity: number
  readonly sold: number
}

interface SupabaseTierQuoteRow extends SupabaseTierInventoryRow {
  readonly id: string
  readonly name: string
  readonly price: number
  readonly sort_order: number
}

interface SupabaseTicketTierTable {
  select(columns: 'capacity, sold'): SupabaseQuery<SupabaseTierInventoryRow>
  select(
    columns: 'id, name, price, capacity, sold, sort_order',
  ): SupabaseQuery<SupabaseTierQuoteRow>
}

interface SupabaseEdgeOrdersTable {
  upsert(values: Readonly<Record<string, unknown>>): PromiseLike<{ readonly error: SupabaseError | null }>
}

export interface EdgeSupabaseClient {
  from(table: 'ticket_tiers'): SupabaseTicketTierTable
  schema(schema: 'ticketing'): {
    from(table: 'edge_orders'): SupabaseEdgeOrdersTable
  }
}

export interface EdgeOrderCache {
  get<T = unknown>(key: string): Promise<T | null>
  set(key: string, value: unknown, options?: { readonly ex?: number }): Promise<unknown>
}

interface CachedEdgeOrder extends EdgePaymentContext {
  readonly unitPrice?: number
  readonly holdExpiresAt?: string
  readonly providerTransactionId?: string
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function isEdgeOrderStatus(value: unknown): value is EdgeOrderStatus {
  return (
    value === 'HELD' ||
    value === 'PAID' ||
    value === 'FAILED' ||
    value === 'EXPIRED' ||
    value === 'PAYMENT_REVIEW_REQUIRED'
  )
}

function parseCachedEdgeOrder(value: unknown): CachedEdgeOrder | undefined {
  let parsed: unknown = value
  if (typeof value === 'string') {
    try {
      parsed = JSON.parse(value) as unknown
    } catch {
      return undefined
    }
  }
  if (
    !isRecord(parsed) ||
    typeof parsed.orderId !== 'string' ||
    typeof parsed.userId !== 'string' ||
    typeof parsed.eventId !== 'string' ||
    typeof parsed.tierId !== 'string' ||
    typeof parsed.providerOrderId !== 'string' ||
    typeof parsed.quantity !== 'number' ||
    typeof parsed.amount !== 'number' ||
    !isEdgeOrderStatus(parsed.status)
  ) {
    return undefined
  }
  return {
    orderId: parsed.orderId,
    userId: parsed.userId,
    eventId: parsed.eventId,
    tierId: parsed.tierId,
    providerOrderId: parsed.providerOrderId,
    quantity: parsed.quantity,
    amount: parsed.amount,
    status: parsed.status,
    ...(typeof parsed.unitPrice === 'number' ? { unitPrice: parsed.unitPrice } : {}),
    ...(typeof parsed.holdExpiresAt === 'string' ? { holdExpiresAt: parsed.holdExpiresAt } : {}),
    ...(typeof parsed.providerTransactionId === 'string'
      ? { providerTransactionId: parsed.providerTransactionId }
      : {}),
  }
}

export class EdgeCheckoutRepository {
  constructor(
    private readonly sql?: DatabaseClient,
    private readonly supabaseFallback?: EdgeSupabaseClient,
    private readonly redisCache?: EdgeOrderCache,
  ) {}

  async getEventAvailability(eventId: string): Promise<number> {
    if (this.sql) {
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
      } catch (error: unknown) {
        if (error instanceof DomainError) throw error
        if (!this.supabaseFallback) throw error
      }
    }
    if (this.supabaseFallback) {
      const { data, error } = await this.supabaseFallback
        .from('ticket_tiers')
        .select('capacity, sold')
        .eq('concert_id', eventId)
      if (!error && data && data.length > 0) {
        return data.reduce((acc, tier) => acc + Math.max(tier.capacity - tier.sold, 0), 0)
      }
    }
    throw new DomainError('NOT_FOUND', 'Event inventory was not found')
  }

  async getTierQuote(input: {
    eventId: string
    tierId?: string
    quantity: number
  }): Promise<EdgeTierQuote> {
    if (this.sql) {
      try {
        const rows = await this.sql<{
          id: string
          name: string
          price: number
          available: number
          match_count: number
        }[]>`
          with matched as (
            select id, name, price, greatest(capacity - sold, 0)::integer as available
            from public.ticket_tiers
            where concert_id = ${input.eventId}
              and (${input.tierId ?? null}::uuid is null or id = ${input.tierId ?? null}::uuid)
            order by sort_order
            limit 2
          )
          select id, name, price, available, (select count(*)::integer from matched) as match_count
          from matched
          limit 1
        `
        const tier = rows[0]
        if (tier === undefined) {
          throw new DomainError('NOT_FOUND', 'Ticket tier was not found')
        }
        if (input.tierId === undefined && tier.match_count !== 1) {
          throw new DomainError('VALIDATION_ERROR', 'tierId is required when an event has multiple tiers')
        }
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
      } catch (error: unknown) {
        if (error instanceof DomainError) throw error
        if (!this.supabaseFallback) throw error
      }
    }
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
        if (!tier) throw new DomainError('NOT_FOUND', 'Ticket tier was not found')
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
    throw new DomainError('NOT_FOUND', 'Ticket tier was not found')
  }

  async upsertHoldOrder(order: EdgeHoldOrder): Promise<void> {
    if (this.redisCache) {
      await this.redisCache.set(
        `edge:order:${order.id}`,
        JSON.stringify({
          orderId: order.id,
          userId: order.userId,
          eventId: order.eventId,
          tierId: order.tierId,
          providerOrderId: order.providerOrderId,
          quantity: order.quantity,
          unitPrice: order.unitPrice,
          amount: order.amount,
          status: 'HELD',
          holdExpiresAt: order.holdExpiresAt.toISOString(),
        }),
        { ex: 86400 }
      )
    }

    const logContext = {
      orderId: order.id,
      providerOrderId: order.providerOrderId,
      eventId: order.eventId,
      tierId: order.tierId,
    }

    if (!this.sql) {
      try {
        await this.upsertHoldOrderWithSupabase(order)
        return
      } catch (error: unknown) {
        logger.error('edge_order_persistence_failed', {
          ...logContext,
          primary: 'DATABASE_URL is not configured',
          fallback: errorMessage(error),
        })
        throw new Error(
          `[EdgeCheckoutRepository] Edge order persistence failed: DATABASE_URL is not configured and Supabase fallback failed (${errorMessage(error)})`,
        )
      }
    }

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
    } catch (error: unknown) {
      if (error instanceof DomainError) {
        logger.warn('edge_order_persistence_rejected', {
          ...logContext,
          code: error.code,
          error: error.message,
        })
        throw error
      }

      try {
        await this.upsertHoldOrderWithSupabase(order)
        logger.warn('edge_order_primary_persistence_failed_fallback_succeeded', {
          ...logContext,
          primary: errorMessage(error),
        })
        return
      } catch (fallbackError: unknown) {
        logger.error('edge_order_persistence_failed', {
          ...logContext,
          primary: errorMessage(error),
          fallback: errorMessage(fallbackError),
        })
        throw new Error(
          `[EdgeCheckoutRepository] Edge order persistence failed on primary SQL (${errorMessage(error)}) and Supabase fallback (${errorMessage(fallbackError)})`,
        )
      }
    }
  }

  private async upsertHoldOrderWithSupabase(order: EdgeHoldOrder): Promise<void> {
    if (!this.supabaseFallback) {
      throw new Error('Supabase fallback is not configured')
    }
    const { error } = await this.supabaseFallback.schema('ticketing').from('edge_orders').upsert({
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
    if (error) throw new Error(error.message || 'Supabase fallback returned an unknown error')
  }

  async getPaymentContext(orderId: string): Promise<EdgePaymentContext> {
    if (this.sql) {
      try {
        const rows = await this.sql<EdgeOrderRow[]>`
          select id, user_id, event_id, tier_id, idempotency_key, request_hash,
                 provider_order_id, quantity, unit_price, amount, status, hold_expires_at
          from ticketing.edge_orders
          where id = ${orderId}
        `
        const row = rows[0]
        if (row !== undefined) {
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
      } catch (error: unknown) {
        if (!this.redisCache) throw error
      }
    }

    if (this.redisCache) {
      const row = parseCachedEdgeOrder(await this.redisCache.get(`edge:order:${orderId}`))
      if (row) {
        return {
          orderId: row.orderId,
          userId: row.userId,
          eventId: row.eventId,
          tierId: row.tierId,
          providerOrderId: row.providerOrderId,
          quantity: row.quantity,
          amount: row.amount,
          status: row.status,
        }
      }
    }

    throw new DomainError('NOT_FOUND', 'Edge order was not found')
  }

  async recordNotification(
    orderId: string,
    notification: MidtransNotification,
  ): Promise<boolean> {
    if (this.redisCache) {
      await this.redisCache.set(
        `edge:inbox:${notification.transaction_id}`,
        JSON.stringify(notification),
        { ex: 86400 }
      )
    }

    if (this.sql) {
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

    return true
  }

  async markPaid(context: EdgePaymentContext, transactionId: string): Promise<EdgeOrderStatus> {
    if (this.redisCache) {
      await this.redisCache.set(
        `edge:order:${context.orderId}`,
        JSON.stringify({ ...context, status: 'PAID', providerTransactionId: transactionId }),
        { ex: 86400 }
      )
    }

    if (!this.sql) return 'PAID'

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
    if (this.redisCache) {
      const order = parseCachedEdgeOrder(await this.redisCache.get(`edge:order:${orderId}`))
      if (order) {
        await this.redisCache.set(
          `edge:order:${orderId}`,
          JSON.stringify({ ...order, status: 'FAILED', providerTransactionId: transactionId }),
          { ex: 86400 }
        )
      }
    }
    if (this.sql) {
      await this.sql`
        update ticketing.edge_orders
        set status = 'FAILED', provider_transaction_id = ${transactionId}, updated_at = now()
        where id = ${orderId} and status = 'HELD'
      `
    }
  }

  async markReviewRequired(orderId: string, transactionId: string): Promise<void> {
    if (this.redisCache) {
      const order = parseCachedEdgeOrder(await this.redisCache.get(`edge:order:${orderId}`))
      if (order) {
        await this.redisCache.set(
          `edge:order:${orderId}`,
          JSON.stringify({ ...order, status: 'PAYMENT_REVIEW_REQUIRED', providerTransactionId: transactionId }),
          { ex: 86400 }
        )
      }
    }
    if (this.sql) {
      await this.sql`
        update ticketing.edge_orders
        set status = 'PAYMENT_REVIEW_REQUIRED',
            provider_transaction_id = ${transactionId}, updated_at = now()
        where id = ${orderId} and status <> 'PAID'
      `
    }
  }

  async markExpired(orderIds: readonly string[]): Promise<void> {
    if (orderIds.length === 0) return
    if (this.redisCache) {
      for (const id of orderIds) {
        const order = parseCachedEdgeOrder(await this.redisCache.get(`edge:order:${id}`))
        if (order) {
          await this.redisCache.set(
            `edge:order:${id}`,
            JSON.stringify({ ...order, status: 'EXPIRED' }),
            { ex: 86400 }
          )
        }
      }
    }
    if (this.sql) {
      await this.sql`
        update ticketing.edge_orders set status = 'EXPIRED', updated_at = now()
        where id in ${this.sql(orderIds)} and status = 'HELD'
      `
    }
  }

  async markNotificationProcessed(orderId: string, notification: MidtransNotification): Promise<void> {
    if (this.redisCache) {
      await this.redisCache.set(
        `edge:inbox:${notification.transaction_id}:processed`,
        JSON.stringify({ processedAt: new Date().toISOString() }),
        { ex: 86400 }
      )
    }
    if (this.sql) {
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
}
