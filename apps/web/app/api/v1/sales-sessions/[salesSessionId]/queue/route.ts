import { uuidSchema } from '@war-ticket/contracts'
import { apiError, assertSameOrigin, requireUser } from '@/lib/server/api'
import { queueService } from '@/lib/server/runtime'

interface RouteContext {
  readonly params: Promise<{ salesSessionId: string }>
}

export async function POST(request: Request, context: RouteContext): Promise<Response> {
  try {
    assertSameOrigin(request)
    const user = await requireUser()
    const { salesSessionId } = await context.params
    const result = await queueService().join(uuidSchema.parse(salesSessionId), user.id)
    return Response.json(result, { status: 201, headers: { 'cache-control': 'no-store' } })
  } catch (error) {
    return apiError(error, request)
  }
}

export async function GET(request: Request, context: RouteContext): Promise<Response> {
  try {
    const user = await requireUser()
    const { salesSessionId } = await context.params
    const result = await queueService().getStatus(uuidSchema.parse(salesSessionId), user.id)
    return Response.json(result, { headers: { 'cache-control': 'no-store' } })
  } catch (error) {
    return apiError(error, request)
  }
}
