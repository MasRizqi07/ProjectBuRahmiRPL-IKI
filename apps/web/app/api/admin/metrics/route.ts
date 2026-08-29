import { requirePlatformRole } from '@/lib/auth/authorization'
import { apiError } from '@/lib/server/api'
import { database } from '@/lib/server/runtime'

export async function GET(request: Request): Promise<Response> {
  try {
    await requirePlatformRole(['PLATFORM_ADMIN'])
    const [metrics] = await database()<Array<{ users: number; events: number; paid_orders: number; gross_volume: number; open_disputes: number }>>`
      select (select count(*)::integer from public.profiles) users,
             (select count(*)::integer from ticketing.events) events,
             (select count(*)::integer from ticketing.orders where status = 'PAID') paid_orders,
             (select coalesce(sum(total),0)::bigint from ticketing.orders where status = 'PAID') gross_volume,
             (select count(*)::integer from public.disputes where status in ('OPEN','INVESTIGATING','REFUND_PENDING')) open_disputes
    `
    return Response.json(metrics, { headers: { 'cache-control': 'private, no-store' } })
  } catch (error) { return apiError(error, request) }
}
