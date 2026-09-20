import { uuidSchema } from '@war-ticket/contracts'
import { apiError, assertSameOrigin, requireUser } from '@/lib/server/api'
import { checkoutGateway, serverlessCheckoutService } from '@/lib/server/runtime'
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
    await enforceRateLimit({ operation: 'join', eventId, userId: user.id, request })

    if (process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL) {
      const result = await serverlessCheckoutService().joinQueue(eventId, user.id)
      const { created, ...response } = result
      return Response.json(response, {
        status: created ? 201 : 200,
        headers: { 'cache-control': 'no-store' },
      })
    }

    const result = await checkoutGateway().joinQueue(eventId, user.id)
    return Response.json(result, {
      status: 201,
      headers: { 'cache-control': 'no-store' },
    })
  } catch (error) {
    return apiError(error, request)
  }
}
