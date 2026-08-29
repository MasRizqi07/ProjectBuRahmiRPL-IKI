import { z } from 'zod'
import { DomainError } from '@war-ticket/domain'
import { apiError, assertSameOrigin, parseJson, requireUser } from '@/lib/server/api'
import { database } from '@/lib/server/runtime'

const schema = z.object({ subject: z.string().trim().min(3).max(160), description: z.string().trim().min(10).max(3_000) })
export async function GET(request: Request): Promise<Response> { try { const user = await requireUser(); const cases = await database()`select id, subject, description, status, created_at from public.concierge_cases where user_id = ${user.id} order by created_at desc`; return Response.json({ cases }, { headers: { 'cache-control': 'private, no-store' } }) } catch (error) { return apiError(error, request) } }
export async function POST(request: Request): Promise<Response> {
  try { assertSameOrigin(request); const user = await requireUser(); const eligible = await database()`select user_id from public.elite_memberships where user_id = ${user.id} and status = 'ACTIVE' and starts_at <= now() and ends_at > now()`; if (eligible.length !== 1) throw new DomainError('FORBIDDEN', 'Active Elite membership is required'); const input = await parseJson(request, schema); const rows = await database()`insert into public.concierge_cases (user_id, subject, description) values (${user.id}, ${input.subject}, ${input.description}) returning id, status`; return Response.json(rows[0], { status: 201 }) }
  catch (error) { return apiError(error, request) }
}
