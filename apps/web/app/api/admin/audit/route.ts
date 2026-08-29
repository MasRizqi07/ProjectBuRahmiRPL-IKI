import { z } from 'zod'
import { requirePlatformRole } from '@/lib/auth/authorization'
import { apiError } from '@/lib/server/api'
import { database } from '@/lib/server/runtime'

const querySchema = z.object({ cursor: z.coerce.number().int().positive().optional(), format: z.enum(['json','csv']).default('json') })
const quote = (value: string): string => `"${value.replaceAll('"','""')}"`
export async function GET(request: Request): Promise<Response> {
  try {
    await requirePlatformRole(['PLATFORM_ADMIN']); const query = querySchema.parse(Object.fromEntries(new URL(request.url).searchParams))
    const rows = await database()<Array<{ id: number; tenant_id: string | null; actor_user_id: string | null; action: string; aggregate_type: string; aggregate_id: string | null; metadata: unknown; occurred_at: Date }>>`
      select id, tenant_id, actor_user_id, action, aggregate_type, aggregate_id, metadata, occurred_at from ticketing.audit_log
      where (${query.cursor ?? null}::bigint is null or id < ${query.cursor ?? null}) order by id desc limit 100
    `
    if (query.format === 'csv') { const content = ['id,tenant_id,actor_user_id,action,aggregate_type,aggregate_id,occurred_at', ...rows.map((row) => [String(row.id), row.tenant_id ?? '', row.actor_user_id ?? '', row.action, row.aggregate_type, row.aggregate_id ?? '', row.occurred_at.toISOString()].map(quote).join(','))].join('\r\n'); return new Response(content, { headers: { 'content-type': 'text/csv; charset=utf-8', 'content-disposition': 'attachment; filename="war-ticket-audit.csv"' } }) }
    return Response.json({ logs: rows, nextCursor: rows.length === 100 ? rows.at(-1)!.id : null }, { headers: { 'cache-control': 'private, no-store' } })
  } catch (error) { return apiError(error, request) }
}
