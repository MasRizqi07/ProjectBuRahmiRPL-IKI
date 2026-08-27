import { uuidSchema } from '@war-ticket/contracts'
import { apiError, requireUser } from '@/lib/server/api'
import { catalogRepository } from '@/lib/server/runtime'

interface RouteContext {
  readonly params: Promise<{ salesSessionId: string }>
}

export async function GET(request: Request, context: RouteContext): Promise<Response> {
  try {
    await requireUser()
    const { salesSessionId } = await context.params
    const inventory = await catalogRepository().getSalesInventory(uuidSchema.parse(salesSessionId))
    return Response.json(inventory, {
      headers: { 'cache-control': 'private, no-store' },
    })
  } catch (error) {
    return apiError(error, request)
  }
}
