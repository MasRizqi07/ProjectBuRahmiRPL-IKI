import { randomUUID } from 'node:crypto'
import { z } from 'zod'
import { idempotencyKeySchema, uuidSchema } from '@war-ticket/contracts'
import { DomainError } from '@war-ticket/domain'
import { MidtransClient } from '@war-ticket/payments'
import { requirePlatformRole } from '@/lib/auth/authorization'
import { apiError, assertSameOrigin, parseJson } from '@/lib/server/api'
import { database, paymentRepository } from '@/lib/server/runtime'

const refundSchema = z.object({ amount: z.number().int().positive(), reason: z.string().trim().min(5).max(255) })
interface RouteContext { readonly params: Promise<{ disputeId: string }> }

export async function POST(request: Request, context: RouteContext): Promise<Response> {
  try {
    assertSameOrigin(request); const viewer = await requirePlatformRole(['PLATFORM_ADMIN']); const disputeId = uuidSchema.parse((await context.params).disputeId); const input = await parseJson(request, refundSchema); const key = idempotencyKeySchema.parse(request.headers.get('idempotency-key'))
    const disputes = await database()<Array<{ order_id: string; tenant_id: string; status: string }>>`select dispute.order_id, orders.tenant_id, dispute.status from public.disputes dispute join ticketing.orders orders on orders.id = dispute.order_id where dispute.id = ${disputeId}`
    const dispute = disputes[0]; if (!dispute) throw new DomainError('NOT_FOUND', 'Dispute was not found')
    const refundId = randomUUID(); const refundKey = `WTREF-${refundId.replaceAll('-','')}`
    const claimed = await database()<Array<{ id: string; refund_key: string; status: string }>>`
      insert into ticketing.refund_requests (id, tenant_id, dispute_id, order_id, actor_user_id, idempotency_key, refund_key, amount, reason)
      values (${refundId}, ${dispute.tenant_id}, ${disputeId}, ${dispute.order_id}, ${viewer.id}, ${key}, ${refundKey}, ${input.amount}, ${input.reason})
      on conflict (actor_user_id, idempotency_key) do update set updated_at = now()
      returning id, refund_key, status
    `
    const requestRecord = claimed[0]!; if (requestRecord.status === 'PROVIDER_ACCEPTED') return Response.json(requestRecord)
    const contextData = await paymentRepository().getRefundContext(dispute.order_id)
    if (contextData.orderStatus !== 'PAID' || input.amount !== contextData.amount) throw new DomainError('INVALID_STATE_TRANSITION', 'Only a full refund of a paid order is supported')
    const client = new MidtransClient(contextData.serverKey, contextData.production)
    const referenceId = contextData.providerTransactionId ?? contextData.providerOrderId
    const providerStatus = await client.getStatus(referenceId)
    if (providerStatus.order_id !== contextData.providerOrderId || Number(providerStatus.gross_amount) !== contextData.amount || providerStatus.transaction_status !== 'settlement') throw new DomainError('INVALID_STATE_TRANSITION', 'Provider has not confirmed a settled payment')
    let provider: Awaited<ReturnType<MidtransClient['refundPayment']>>
    try {
      provider = await client.refundPayment({ referenceId, refundKey: requestRecord.refund_key, amount: input.amount, reason: input.reason })
    } catch (error) {
      await database()`update ticketing.refund_requests set status = 'PROVIDER_UNKNOWN', updated_at = now() where id = ${requestRecord.id}`
      throw error
    }
    await database().begin(async (transaction) => {
      await transaction`update ticketing.refund_requests set status = 'PROVIDER_ACCEPTED', provider_response = ${JSON.stringify(provider)}::jsonb, updated_at = now() where id = ${requestRecord.id}`
      await transaction`update ticketing.orders set status = 'REFUNDED', updated_at = now() where id = ${dispute.order_id} and status = 'PAID'`
      await transaction`update ticketing.payment_attempts set status = 'REFUNDED', updated_at = now() where id = ${contextData.paymentAttemptId}`
      await transaction`update ticketing.tickets set status = 'REFUNDED' where order_id = ${dispute.order_id} and status <> 'REDEEMED'`
      await transaction`update public.disputes set status = 'RESOLVED', resolution = 'Refund accepted by Midtrans', assigned_to = ${viewer.id}, updated_at = now() where id = ${disputeId}`
      await transaction`insert into ticketing.audit_log (tenant_id, actor_user_id, action, aggregate_type, aggregate_id, metadata) values (${dispute.tenant_id}, ${viewer.id}, 'REFUND_PROVIDER_ACCEPTED', 'order', ${dispute.order_id}, ${JSON.stringify({ disputeId, amount: input.amount, refundKey: requestRecord.refund_key })}::jsonb)`
    })
    return Response.json({ id: requestRecord.id, status: 'PROVIDER_ACCEPTED', providerStatus: provider.transaction_status })
  } catch (error) { return apiError(error, request) }
}
