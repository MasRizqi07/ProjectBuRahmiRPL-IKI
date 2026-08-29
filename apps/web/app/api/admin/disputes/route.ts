import { z } from 'zod'
import { requirePlatformRole } from '@/lib/auth/authorization'
import { apiError, assertSameOrigin, parseJson } from '@/lib/server/api'
import { database } from '@/lib/server/runtime'

const updateSchema = z.object({ disputeId: z.string().uuid(), status: z.enum(['INVESTIGATING','REJECTED','RESOLVED']), resolution: z.string().trim().min(3).max(2_000) })
export async function GET(request: Request): Promise<Response> {
  try { await requirePlatformRole(['SUPPORT','PLATFORM_ADMIN']); const disputes = await database()`select dispute.id, dispute.order_id, dispute.reason, dispute.status, dispute.resolution, dispute.created_at, profile.full_name, orders.total from public.disputes dispute left join public.profiles profile on profile.id = dispute.user_id join ticketing.orders orders on orders.id = dispute.order_id order by dispute.created_at desc limit 100`; return Response.json({ disputes }, { headers: { 'cache-control': 'private, no-store' } }) }
  catch (error) { return apiError(error, request) }
}
export async function PATCH(request: Request): Promise<Response> {
  try { assertSameOrigin(request); const viewer = await requirePlatformRole(['SUPPORT','PLATFORM_ADMIN']); const input = await parseJson(request, updateSchema); const rows = await database()`update public.disputes set status = ${input.status}, resolution = ${input.resolution}, assigned_to = ${viewer.id}, updated_at = now() where id = ${input.disputeId} and status <> 'REFUND_PENDING' returning id, status`; return Response.json(rows[0] ?? null, { status: rows[0] ? 200 : 409 }) }
  catch (error) { return apiError(error, request) }
}
