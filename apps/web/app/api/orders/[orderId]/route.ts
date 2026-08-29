import { uuidSchema } from '@war-ticket/contracts'
import { apiError, requireUser } from '@/lib/server/api'
import { checkoutGateway } from '@/lib/server/runtime'

interface RouteContext { readonly params: Promise<{ orderId: string }> }

export async function GET(request: Request, context: RouteContext): Promise<Response> {
  try {
    const user = await requireUser()
    const orderId = uuidSchema.parse((await context.params).orderId)
    const status = await checkoutGateway().orderStatus(orderId, user.id)
    return Response.json(status, { headers: { 'cache-control': 'private, no-store' } })
  } catch (error) {
    return apiError(error, request)
  }
}
