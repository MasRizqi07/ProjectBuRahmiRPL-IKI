import { midtransNotificationSchema } from '@war-ticket/contracts'
import { apiError, parseJson } from '@/lib/server/api'
import { checkoutGateway } from '@/lib/server/runtime'

export async function POST(request: Request): Promise<Response> {
  try {
    const notification = await parseJson(request, midtransNotificationSchema)
    const processed = await checkoutGateway().acceptMidtransNotification(notification)
    return Response.json({ accepted: true, processed })
  } catch (error) {
    return apiError(error, request)
  }
}
