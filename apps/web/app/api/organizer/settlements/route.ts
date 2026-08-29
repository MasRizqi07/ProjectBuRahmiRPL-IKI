import { z } from 'zod'
import { idempotencyKeySchema } from '@war-ticket/contracts'
import { DomainError } from '@war-ticket/domain'
import { requireTenantPermission } from '@/lib/auth/authorization'
import { apiError, assertSameOrigin, parseJson } from '@/lib/server/api'
import { database } from '@/lib/server/runtime'

const tenantQuery = z.object({ tenantId: z.string().uuid() })
const payoutSchema = z.object({ tenantId: z.string().uuid(), settlementId: z.string().uuid() })

export async function GET(request: Request): Promise<Response> {
  try {
    const { tenantId } = tenantQuery.parse(Object.fromEntries(new URL(request.url).searchParams))
    await requireTenantPermission(tenantId, 'FINANCE')
    const settlements = await database()`select id, event_id, gross_amount, fees, net_amount, status, payout_requested_at, paid_at from ticketing.settlements where tenant_id = ${tenantId} order by created_at desc`
    return Response.json({ settlements }, { headers: { 'cache-control': 'private, no-store' } })
  } catch (error) { return apiError(error, request) }
}

export async function POST(request: Request): Promise<Response> {
  try {
    assertSameOrigin(request)
    const input = await parseJson(request, payoutSchema)
    const key = idempotencyKeySchema.parse(request.headers.get('idempotency-key'))
    const viewer = await requireTenantPermission(input.tenantId, 'FINANCE')
    const rows = await database().begin(async (transaction) => {
      const merchant = await transaction`select tenant_id from ticketing.merchant_configs where tenant_id = ${input.tenantId} and enabled = true`
      if (merchant.length !== 1) throw new DomainError('PAYMENT_PROVIDER_UNAVAILABLE', 'Payout is disabled until the organizer merchant is configured')
      const claimed = await transaction`insert into ticketing.organizer_mutation_keys (tenant_id, actor_user_id, key, operation) values (${input.tenantId}, ${viewer.id}, ${key}, 'REQUEST_PAYOUT') on conflict do nothing returning key`
      if (claimed.length === 0) return transaction`select id, status from ticketing.settlements where tenant_id = ${input.tenantId} and id = ${input.settlementId}`
      const updated = await transaction`update ticketing.settlements set status = 'PAYOUT_REQUESTED', payout_requested_by = ${viewer.id}, payout_requested_at = now() where tenant_id = ${input.tenantId} and id = ${input.settlementId} and status = 'PAYABLE' returning id, status`
      if (updated.length !== 1) throw new DomainError('INVALID_STATE_TRANSITION', 'Settlement is not payable')
      await transaction`insert into ticketing.audit_log (tenant_id, actor_user_id, action, aggregate_type, aggregate_id) values (${input.tenantId}, ${viewer.id}, 'PAYOUT_REQUESTED', 'settlement', ${input.settlementId})`
      return updated
    })
    return Response.json(rows[0])
  } catch (error) { return apiError(error, request) }
}
