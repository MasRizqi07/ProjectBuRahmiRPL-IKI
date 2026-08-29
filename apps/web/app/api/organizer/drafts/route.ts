import { randomUUID } from 'node:crypto'
import { z } from 'zod'
import { DomainError } from '@war-ticket/domain'
import { apiError, assertSameOrigin, parseJson } from '@/lib/server/api'
import { requireAnyTenantRole } from '@/lib/auth/authorization'
import { database } from '@/lib/server/runtime'

const tierSchema = z.object({ name: z.string().trim().min(1).max(100), price: z.number().int().nonnegative(), capacity: z.number().int().positive(), perks: z.string().max(1_000) })
const payloadSchema = z.object({
  title: z.string().max(160), artist: z.string().max(160), category: z.string().max(80), venue: z.string().max(160), city: z.string().max(100), date: z.string().max(32), time: z.string().max(16), requireNik: z.boolean(), maxTicketsPerUser: z.number().int().min(1).max(20), tiers: z.array(tierSchema).max(20), imagePath: z.string().max(500).optional(),
})
const requestSchema = z.object({ id: z.string().uuid().optional(), tenantId: z.string().uuid().optional(), expectedVersion: z.number().int().positive().optional(), submit: z.boolean().default(false), payload: payloadSchema })

export async function POST(request: Request): Promise<Response> {
  try {
    assertSameOrigin(request)
    const viewer = await requireAnyTenantRole()
    const input = await parseJson(request, requestSchema)
    const tenantId = viewer.tenantId === '*' ? input.tenantId : viewer.tenantId
    if (!tenantId) throw new DomainError('VALIDATION_ERROR', 'tenantId is required for platform administrators')
    const id = input.id ?? randomUUID()
    const submit = input.submit ?? false
    const sql = database()
    const rows = await sql<Array<{ id: string; version: number; updated_at: Date }>>`
      insert into ticketing.event_drafts (id, tenant_id, created_by, payload, submitted_at)
      values (${id}, ${tenantId}, ${viewer.id}, ${JSON.stringify(input.payload)}::jsonb, ${submit ? new Date() : null})
      on conflict (id) do update
      set payload = excluded.payload,
          version = ticketing.event_drafts.version + 1,
          submitted_at = case when ${submit} then now() else ticketing.event_drafts.submitted_at end,
          updated_at = now()
      where ticketing.event_drafts.tenant_id = ${tenantId}
        and (${input.expectedVersion ?? null}::bigint is null or ticketing.event_drafts.version = ${input.expectedVersion ?? null})
      returning id, version, updated_at
    `
    if (!rows[0]) throw new DomainError('CONFLICT', 'Draft was changed in another session')
    await sql`insert into ticketing.audit_log (tenant_id, actor_user_id, action, aggregate_type, aggregate_id, metadata) values (${tenantId}, ${viewer.id}, ${submit ? 'EVENT_DRAFT_SUBMITTED' : 'EVENT_DRAFT_SAVED'}, 'event_draft', ${id}, ${JSON.stringify({ version: rows[0].version })}::jsonb)`
    return Response.json({ id: rows[0].id, version: rows[0].version, updatedAt: rows[0].updated_at.toISOString(), submitted: submit })
  } catch (error) { return apiError(error, request) }
}
