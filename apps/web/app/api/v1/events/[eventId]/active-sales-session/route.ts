import { uuidSchema } from '@war-ticket/contracts'
import { apiError, requireUser } from '@/lib/server/api'
import { catalogRepository } from '@/lib/server/runtime'

interface RouteContext {
  readonly params: Promise<{ eventId: string }>
}

export async function GET(request: Request, context: RouteContext): Promise<Response> {
  try {
    await requireUser()
    const { eventId } = await context.params
    const session = await catalogRepository().getActiveSalesSession(uuidSchema.parse(eventId))
    return Response.json(session, { headers: { 'cache-control': 'private, no-store' } })
  } catch (error) {
    return apiError(error, request)
  }
}
