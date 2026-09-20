import { createReservationRequestSchema, idempotencyKeySchema, uuidSchema } from '@war-ticket/contracts'
import { DomainError } from '@war-ticket/domain'
import { apiError, assertSameOrigin, requireUser } from '@/lib/server/api'
import { checkoutGateway, serverlessCheckoutService } from '@/lib/server/runtime'
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

    let body: unknown
    try {
      body = await request.json()
    } catch (err) {
      throw new DomainError('VALIDATION_ERROR', 'Request body must be valid JSON', { cause: err })
    }

    // Serverless checkout engine path (tests/load/serverless-reserve.js)
    if (typeof body === 'object' && body !== null && 'qty' in body) {
      const idempotencyHeader = request.headers.get('idempotency-key')
      if (idempotencyHeader === null) {
        throw new DomainError('VALIDATION_ERROR', 'Idempotency-Key header is required')
      }
      const idempotencyKey = idempotencyKeySchema.parse(idempotencyHeader)
      const input = reserveRequestSchema.parse(body)
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
    }

    // Canonical checkout gateway path (UI multi-item reservation)
    const input = createReservationRequestSchema.parse(body)
    const result = await checkoutGateway().reserve(eventId, user.id, input)
    return Response.json(result, {
      status: 201,
      headers: { 'cache-control': 'no-store' },
    })
  } catch (error) {
    return apiError(error, request)
  }
}
