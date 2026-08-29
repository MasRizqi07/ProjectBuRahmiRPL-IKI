import { uuidSchema } from '@war-ticket/contracts'
import { apiError, requireUser } from '@/lib/server/api'
import { checkoutGateway } from '@/lib/server/runtime'

interface RouteContext { readonly params: Promise<{ eventId: string }> }

export async function GET(request: Request, context: RouteContext): Promise<Response> {
  try {
    await requireUser()
    const eventId = uuidSchema.parse((await context.params).eventId)
    const inventory = await checkoutGateway().inventory(eventId)
    return Response.json(inventory, { headers: { 'cache-control': 'private, no-store' } })
  } catch (error) {
    return apiError(error, request)
  }
}
