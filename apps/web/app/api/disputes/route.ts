import { z } from 'zod'
import { apiError, assertSameOrigin, parseJson, requireUser } from '@/lib/server/api'
import { database } from '@/lib/server/runtime'

const createSchema = z.object({ orderId: z.string().uuid(), reason: z.string().trim().min(10).max(1_000) })
export async function POST(request: Request): Promise<Response> {
  try {
    assertSameOrigin(request); const user = await requireUser(); const input = await parseJson(request, createSchema)
    const owned = await database()`select id from ticketing.orders where id = ${input.orderId} and user_id = ${user.id}`
    if (owned.length !== 1) return Response.json({ error: { code: 'NOT_FOUND', message: 'Order was not found', retryable: false } }, { status: 404 })
    const rows = await database()<Array<{ id: string; status: string }>>`insert into public.disputes (user_id, order_id, reason) values (${user.id}, ${input.orderId}, ${input.reason}) on conflict (user_id, order_id, reason) do update set updated_at = now() returning id, status`
    return Response.json(rows[0], { status: 201 })
  } catch (error) { return apiError(error, request) }
}
