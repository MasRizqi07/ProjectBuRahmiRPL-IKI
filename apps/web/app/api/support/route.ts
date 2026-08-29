import { z } from 'zod'
import { apiError, assertSameOrigin, parseJson, requireUser } from '@/lib/server/api'
import { database } from '@/lib/server/runtime'

const supportSchema = z.object({
  orderId: z.string().uuid().optional(),
  subject: z.string().trim().min(5).max(160),
  description: z.string().trim().min(20).max(5_000),
})

export async function GET(request: Request): Promise<Response> {
  try {
    const user = await requireUser()
    const cases = await database()<Array<{
      id: string
      order_id: string | null
      subject: string
      description: string
      status: string
      created_at: string
      updated_at: string
    }>>`
      select id, order_id, subject, description, status, created_at, updated_at
      from public.support_cases
      where user_id = ${user.id}
      order by created_at desc
    `
    return Response.json({ cases }, { headers: { 'cache-control': 'private, no-store' } })
  } catch (error) {
    return apiError(error, request)
  }
}

export async function POST(request: Request): Promise<Response> {
  try {
    assertSameOrigin(request)
    const user = await requireUser()
    const input = await parseJson(request, supportSchema)
    const rows = await database()<Array<{ id: string }>>`
      insert into public.support_cases (user_id, order_id, subject, description)
      values (${user.id}, ${input.orderId ?? null}, ${input.subject}, ${input.description})
      returning id
    `
    return Response.json({ id: rows[0]!.id, status: 'OPEN' }, { status: 201 })
  } catch (error) {
    return apiError(error, request)
  }
}

