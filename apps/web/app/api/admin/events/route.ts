import { z } from 'zod'
import { requirePlatformRole } from '@/lib/auth/authorization'
import { apiError, assertSameOrigin, parseJson } from '@/lib/server/api'
import { database } from '@/lib/server/runtime'

const updateSchema = z.object({ eventId: z.string().uuid(), action: z.enum(['APPROVE','REJECT','PUBLISH','CANCEL']), reason: z.string().trim().min(3).max(500).optional() })
const transitions = { APPROVE: ['SUBMITTED','APPROVED'], REJECT: ['SUBMITTED','REJECTED'], PUBLISH: ['APPROVED','PUBLISHED'], CANCEL: ['PUBLISHED','CANCELLED'] } as const

export async function GET(request: Request): Promise<Response> {
  try { await requirePlatformRole(['PLATFORM_ADMIN']); const events = await database()`select id, tenant_id, title, starts_at, approval_status, approved_at from ticketing.events order by created_at desc limit 100`; return Response.json({ events }, { headers: { 'cache-control': 'private, no-store' } }) }
  catch (error) { return apiError(error, request) }
}

export async function PATCH(request: Request): Promise<Response> {
  try {
    assertSameOrigin(request); const viewer = await requirePlatformRole(['PLATFORM_ADMIN']); const input = await parseJson(request, updateSchema); const [source, target] = transitions[input.action]
    const rows = await database().begin(async (transaction) => {
      const updated = await transaction<Array<{ id: string; tenant_id: string; approval_status: string }>>`
        update ticketing.events set approval_status = ${target}, approved_by = case when ${input.action === 'APPROVE'} then ${viewer.id}::uuid else approved_by end, approved_at = case when ${input.action === 'APPROVE'} then now() else approved_at end, updated_at = now()
        where id = ${input.eventId} and approval_status = ${source} returning id, tenant_id, approval_status
      `
      if (updated[0]) await transaction`insert into ticketing.audit_log (tenant_id, actor_user_id, action, aggregate_type, aggregate_id, metadata) values (${updated[0].tenant_id}, ${viewer.id}, ${`EVENT_${input.action}`}, 'event', ${input.eventId}, ${JSON.stringify({ reason: input.reason ?? null })}::jsonb)`
      return updated
    })
    if (!rows[0]) return Response.json({ error: { code: 'INVALID_STATE_TRANSITION', message: 'Event state changed or action is invalid', retryable: false } }, { status: 409 })
    return Response.json(rows[0])
  } catch (error) { return apiError(error, request) }
}
