import { z } from 'zod'
import { apiError, assertSameOrigin, parseJson, requireUser } from '@/lib/server/api'
import { database } from '@/lib/server/runtime'

const updateSchema = z.object({ markAllRead: z.literal(true) })

export async function GET(request: Request): Promise<Response> {
  try {
    const user = await requireUser()
    const rows = await database()<Array<{ id: string; category: string; title: string; body: string; action_href: string | null; read_at: Date | null; created_at: Date }>>`
      select id, category, title, body, action_href, read_at, created_at
      from public.notifications where user_id = ${user.id}
      order by created_at desc limit 100
    `
    return Response.json({ notifications: rows.map((row) => ({ ...row, read: row.read_at !== null, createdAt: row.created_at.toISOString() })) }, { headers: { 'cache-control': 'private, no-store' } })
  } catch (error) {
    return apiError(error, request)
  }
}

export async function PATCH(request: Request): Promise<Response> {
  try {
    assertSameOrigin(request)
    const user = await requireUser()
    await parseJson(request, updateSchema)
    await database()`update public.notifications set read_at = coalesce(read_at, now()) where user_id = ${user.id}`
    return Response.json({ updated: true })
  } catch (error) {
    return apiError(error, request)
  }
}
