import { uuidSchema } from '@war-ticket/contracts'
import { apiError, requireUser } from '@/lib/server/api'
import { paymentRepository } from '@/lib/server/runtime'

interface RouteContext {
  readonly params: Promise<{ orderId: string }>
}

export async function GET(request: Request, context: RouteContext): Promise<Response> {
  try {
    const user = await requireUser()
    const { orderId } = await context.params
    const result = await paymentRepository().getCheckoutStatus(uuidSchema.parse(orderId), user.id)
    return Response.json(result, { headers: { 'cache-control': 'no-store' } })
  } catch (error) {
    return apiError(error, request)
  }
}
