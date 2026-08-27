import { midtransNotificationSchema } from '@war-ticket/contracts'
import { DomainError } from '@war-ticket/domain'
import { verifyMidtransSignature } from '@war-ticket/payments'
import { apiError, parseJson } from '@/lib/server/api'
import { paymentRepository } from '@/lib/server/runtime'

export async function POST(request: Request): Promise<Response> {
  try {
    const notification = await parseJson(request, midtransNotificationSchema)
    const repository = paymentRepository()
    const context = await repository.getNotificationContext(notification.order_id)
    if (!verifyMidtransSignature(notification, context.serverKey)) {
      throw new DomainError('FORBIDDEN', 'Payment notification signature is invalid')
    }
    await repository.applyNotification(notification)
    return Response.json({ accepted: true })
  } catch (error) {
    return apiError(error, request)
  }
}
