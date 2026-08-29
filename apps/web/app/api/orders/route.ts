import { createCheckoutRequestSchema, idempotencyKeySchema } from '@war-ticket/contracts'
import { DomainError } from '@war-ticket/domain'
import { apiError, assertSameOrigin, parseJson, requireUser } from '@/lib/server/api'
import { checkoutGateway } from '@/lib/server/runtime'

export async function POST(request: Request): Promise<Response> {
  try {
    assertSameOrigin(request)
    const user = await requireUser()
    const idempotencyHeader = request.headers.get('idempotency-key')
    if (!idempotencyHeader) throw new DomainError('VALIDATION_ERROR', 'Idempotency-Key header is required')
    const idempotencyKey = idempotencyKeySchema.parse(idempotencyHeader)
    const input = await parseJson(request, createCheckoutRequestSchema)
    const checkout = await checkoutGateway().checkout(user.id, idempotencyKey, input)
    return Response.json(checkout, { status: 202, headers: { 'cache-control': 'no-store', 'retry-after': '1' } })
  } catch (error) {
    return apiError(error, request)
  }
}
