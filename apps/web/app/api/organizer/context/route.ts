import { z } from 'zod'
import { DomainError } from '@war-ticket/domain'
import { requireAnyTenantRole, requireTenantPermission } from '@/lib/auth/authorization'
import { apiError } from '@/lib/server/api'
import { database } from '@/lib/server/runtime'

const querySchema = z.object({ tenantId: z.string().uuid().optional() })

export async function GET(request: Request): Promise<Response> {
  try {
    const viewer = await requireAnyTenantRole()
    const query = querySchema.parse(Object.fromEntries(new URL(request.url).searchParams))
    const tenantId = viewer.tenantId === '*' ? query.tenantId : viewer.tenantId
    if (!tenantId) throw new DomainError('VALIDATION_ERROR', 'Select a tenant first')
    if (viewer.tenantId === '*') await requireTenantPermission(tenantId, 'VIEW')
    const [metrics] = await database()<Array<{ events: number; paid_orders: number; revenue: number; active_sessions: number }>>`
      select
        (select count(*)::integer from ticketing.events where tenant_id = ${tenantId}) as events,
        (select count(*)::integer from ticketing.orders where tenant_id = ${tenantId} and status = 'PAID') as paid_orders,
        (select coalesce(sum(total), 0)::bigint from ticketing.orders where tenant_id = ${tenantId} and status = 'PAID') as revenue,
        (select count(*)::integer from ticketing.sales_sessions where tenant_id = ${tenantId} and status in ('PRE_QUEUE','OPEN','PAUSED')) as active_sessions
    `
    const events = await database()`select event.id, event.title, event.starts_at, event.approval_status, session.id as sales_session_id, session.status as sales_status from ticketing.events event left join lateral (select id, status from ticketing.sales_sessions where tenant_id = event.tenant_id and event_id = event.id order by sales_open_at desc limit 1) session on true where event.tenant_id = ${tenantId} order by event.starts_at desc`
    const merchant = await database()`select enabled from ticketing.merchant_configs where tenant_id = ${tenantId}`
    return Response.json({ tenantId, role: viewer.tenantRole, metrics, events, merchantEnabled: merchant[0]?.enabled === true }, { headers: { 'cache-control': 'private, no-store' } })
  } catch (error) { return apiError(error, request) }
}
