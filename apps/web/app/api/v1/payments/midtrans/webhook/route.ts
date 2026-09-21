import { midtransNotificationSchema } from '@war-ticket/contracts'
import { DomainError, mapMidtransStatus } from '@war-ticket/domain'
import { verifyMidtransSignature } from '@war-ticket/payments'
import { apiError, parseJson } from '@/lib/server/api'
import { edgeCheckoutRepository, paymentRepository } from '@/lib/server/runtime'

export async function POST(request: Request): Promise<Response> {
  try {
    const notification = await parseJson(request, midtransNotificationSchema)
    const repository = paymentRepository()
    const context = await repository.getNotificationContext(notification.order_id)
    if (!verifyMidtransSignature(notification, context.serverKey)) {
      throw new DomainError('FORBIDDEN', 'Payment notification signature is invalid')
    }

    if (context.isEdge) {
      const newStatus = mapMidtransStatus({
        transactionStatus: notification.transaction_status,
        ...(notification.fraud_status === undefined ? {} : { fraudStatus: notification.fraud_status }),
      })

      const edgeRepo = edgeCheckoutRepository()
      if (newStatus === 'SUCCEEDED') {
        await edgeRepo.markPaid(
          {
            orderId: context.edgeOrderId,
            userId: context.userId,
            eventId: context.eventId,
            tierId: context.tierId,
            providerOrderId: notification.order_id,
            quantity: context.quantity,
            amount: context.amount,
            status: 'HELD',
          },
          notification.transaction_id,
        )
      } else if (newStatus === 'DENIED' || newStatus === 'CANCELLED' || newStatus === 'EXPIRED') {
        await edgeRepo.markFailed(context.edgeOrderId, notification.transaction_id)
      }
      return Response.json({ accepted: true })
    }

    await repository.applyNotification(notification)
    return Response.json({ accepted: true })
  } catch (error) {
    return apiError(error, request)
  }
}
