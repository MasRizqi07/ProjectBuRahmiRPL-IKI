import { uuidSchema } from '@war-ticket/contracts'
import { apiError, requireUser } from '@/lib/server/api'
import { checkoutGateway, serverlessCheckoutService } from '@/lib/server/runtime'
import { enforceRateLimit } from '@/lib/serverless-ticketing/rate-limit'

export const runtime = 'nodejs'

interface RouteContext {
  readonly params: Promise<{ eventId: string }>
}

export async function GET(request: Request, context: RouteContext): Promise<Response> {
  try {
    const user = await requireUser()
    const eventId = uuidSchema.parse((await context.params).eventId)
    await enforceRateLimit({ operation: 'status', eventId, userId: user.id, request })

    if (process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL) {
      const result = await serverlessCheckoutService().queueStatus(eventId, user.id)
      return Response.json(result, { headers: { 'cache-control': 'no-store' } })
    }

    const result = await checkoutGateway().queueStatus(eventId, user.id)
    return Response.json(result, { headers: { 'cache-control': 'no-store' } })
  } catch (error) {
    return apiError(error, request)
  }
}
