import { idempotencyKeySchema, uuidSchema } from '@war-ticket/contracts'
import { DomainError } from '@war-ticket/domain'
import { apiError, assertSameOrigin, parseJson, requireUser } from '@/lib/server/api'
import { serverlessCheckoutService } from '@/lib/server/runtime'
import { reserveRequestSchema } from '@/lib/serverless-ticketing/contracts'
import { enforceRateLimit } from '@/lib/serverless-ticketing/rate-limit'

export const runtime = 'nodejs'

interface RouteContext {
  readonly params: Promise<{ eventId: string }>
}

export async function POST(request: Request, context: RouteContext): Promise<Response> {
  try {
    assertSameOrigin(request)
    const user = await requireUser()
    const eventId = uuidSchema.parse((await context.params).eventId)
    await enforceRateLimit({ operation: 'reserve', eventId, userId: user.id, request })
    const idempotencyHeader = request.headers.get('idempotency-key')
    if (idempotencyHeader === null) {
      throw new DomainError('VALIDATION_ERROR', 'Idempotency-Key header is required')
    }
    const idempotencyKey = idempotencyKeySchema.parse(idempotencyHeader)
    const input = await parseJson(request, reserveRequestSchema)
    const result = await serverlessCheckoutService().reserve({
      eventId,
      userId: user.id,
      idempotencyKey,
      request: input,
    })
    return Response.json(result, {
      status: result.status === 'HOLD_CREATED' ? 201 : 409,
      headers: { 'cache-control': 'no-store' },
    })
  } catch (error) {
    return apiError(error, request)
  }
}
