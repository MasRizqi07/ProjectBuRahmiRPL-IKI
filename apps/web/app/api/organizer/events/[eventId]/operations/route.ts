import { z } from 'zod'
import { idempotencyKeySchema, uuidSchema } from '@war-ticket/contracts'
import { DomainError } from '@war-ticket/domain'
import { requireTenantPermission } from '@/lib/auth/authorization'
import { apiError, assertSameOrigin, parseJson } from '@/lib/server/api'
import { database } from '@/lib/server/runtime'

const operationSchema = z.discriminatedUnion('action', [
  z.object({ action: z.enum(['PAUSE_SALES', 'RESUME_SALES']), salesSessionId: z.string().uuid() }),
  z.object({ action: z.literal('SET_QUOTA'), ticketTypeId: z.string().uuid(), capacity: z.number().int().nonnegative() }),
  z.object({ action: z.literal('BROADCAST'), message: z.string().trim().min(3).max(500) }),
])
interface RouteContext { readonly params: Promise<{ eventId: string }> }

export async function POST(request: Request, context: RouteContext): Promise<Response> {
  try {
    assertSameOrigin(request)
    const eventId = uuidSchema.parse((await context.params).eventId)
    const input = await parseJson(request, operationSchema)
    const idempotencyKey = idempotencyKeySchema.parse(request.headers.get('idempotency-key'))
    const eventRows = await database()<Array<{ tenant_id: string }>>`select tenant_id from ticketing.events where id = ${eventId}`
    const tenantId = eventRows[0]?.tenant_id
    if (!tenantId) throw new DomainError('NOT_FOUND', 'Event was not found')
    const permission = input.action === 'SET_QUOTA' ? 'ADMIN' : 'OPERATE'
    const viewer = await requireTenantPermission(tenantId, permission)

    const response = await database().begin(async (transaction) => {
      const claimed = await transaction`
        insert into ticketing.organizer_mutation_keys (tenant_id, actor_user_id, key, operation)
        values (${tenantId}, ${viewer.id}, ${idempotencyKey}, ${input.action})
        on conflict do nothing returning key
      `
      if (claimed.length === 0) {
        const existing = await transaction<Array<{ operation: string; response: unknown }>>`
          select operation, response from ticketing.organizer_mutation_keys
          where tenant_id = ${tenantId} and actor_user_id = ${viewer.id} and key = ${idempotencyKey}
        `
        if (existing[0]?.operation !== input.action) throw new DomainError('IDEMPOTENCY_CONFLICT', 'Idempotency key belongs to another operation')
        if (existing[0]?.response) return existing[0].response
        throw new DomainError('CONFLICT', 'Operation is already in progress', { retryable: true })
      }

      let result: Readonly<Record<string, unknown>>
      if (input.action === 'PAUSE_SALES' || input.action === 'RESUME_SALES') {
        const target = input.action === 'PAUSE_SALES' ? 'PAUSED' : 'OPEN'
        const source = input.action === 'PAUSE_SALES' ? 'OPEN' : 'PAUSED'
        const updated = await transaction`
          update ticketing.sales_sessions set status = ${target}::ticketing.sales_session_status, updated_at = now()
          where id = ${input.salesSessionId} and tenant_id = ${tenantId} and event_id = ${eventId}
            and status = ${source}::ticketing.sales_session_status returning id
        `
        if (updated.length !== 1) throw new DomainError('INVALID_STATE_TRANSITION', `Sales session cannot transition from its current state to ${target}`)
        result = { eventId, salesSessionId: input.salesSessionId, status: target }
      } else if (input.action === 'SET_QUOTA') {
        const updated = await transaction`
          update ticketing.inventory_pools pool set capacity = ${input.capacity}, version = version + 1, updated_at = now()
          where pool.tenant_id = ${tenantId} and pool.event_id = ${eventId} and pool.ticket_type_id = ${input.ticketTypeId}
            and pool.held + pool.sold <= ${input.capacity} returning ticket_type_id
        `
        if (updated.length !== 1) throw new DomainError('CONFLICT', 'Quota cannot be lower than held plus sold inventory')
        result = { eventId, ticketTypeId: input.ticketTypeId, capacity: input.capacity }
      } else if (input.action === 'BROADCAST') {
        const inserted = await transaction<Array<{ id: string }>>`
          insert into ticketing.broadcasts (tenant_id, event_id, author_user_id, message)
          values (${tenantId}, ${eventId}, ${viewer.id}, ${input.message}) returning id
        `
        result = { eventId, broadcastId: inserted[0]!.id }
      } else {
        throw new DomainError('VALIDATION_ERROR', 'Unsupported organizer operation')
      }
      await transaction`insert into ticketing.audit_log (tenant_id, actor_user_id, action, aggregate_type, aggregate_id, metadata) values (${tenantId}, ${viewer.id}, ${input.action}, 'event', ${eventId}, ${JSON.stringify(result)}::jsonb)`
      await transaction`update ticketing.organizer_mutation_keys set response = ${JSON.stringify(result)}::jsonb where tenant_id = ${tenantId} and actor_user_id = ${viewer.id} and key = ${idempotencyKey}`
      return result
    })
    return Response.json(response)
  } catch (error) { return apiError(error, request) }
}
