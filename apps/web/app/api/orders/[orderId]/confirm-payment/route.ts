import { midtransNotificationSchema, uuidSchema } from '@war-ticket/contracts'
import { DomainError, mapMidtransStatus } from '@war-ticket/domain'
import { verifyMidtransSignature } from '@war-ticket/payments'
import { apiError, parseJson } from '@/lib/server/api'
import { edgeCheckoutRepository, serverlessCheckoutService } from '@/lib/server/runtime'
import { parseEdgePaymentEnvironment } from '@/lib/serverless-ticketing/config'

export const runtime = 'nodejs'

interface RouteContext {
  readonly params: Promise<{ orderId: string }>
}

export async function POST(request: Request, context: RouteContext): Promise<Response> {
  try {
    const orderId = uuidSchema.parse((await context.params).orderId)
    const notification = await parseJson(request, midtransNotificationSchema)
    const environment = parseEdgePaymentEnvironment(process.env)
    const repository = edgeCheckoutRepository()
    const order = await repository.getPaymentContext(orderId)

    if (!verifyMidtransSignature(notification, environment.MIDTRANS_SERVER_KEY)) {
      throw new DomainError('UNAUTHORIZED', 'Payment notification signature is invalid')
    }
    if (notification.order_id !== order.providerOrderId) {
      throw new DomainError('VALIDATION_ERROR', 'Payment provider order does not match the route')
    }
    if (notification.merchant_id !== environment.MIDTRANS_MERCHANT_ID) {
      throw new DomainError('UNAUTHORIZED', 'Payment notification merchant is invalid')
    }
    if (Number(notification.gross_amount) !== order.amount) {
      throw new DomainError('CONFLICT', 'Payment amount does not match the order')
    }

    await repository.recordNotification(orderId, notification)
    const paymentStatus = mapMidtransStatus({
      transactionStatus: notification.transaction_status,
      ...(notification.fraud_status === undefined
        ? {}
        : { fraudStatus: notification.fraud_status }),
    })

    let orderStatus = order.status
    const failedPayment = ['DENIED', 'EXPIRED', 'CANCELLED'].includes(paymentStatus)
    if (order.status === 'PAID' && failedPayment) {
      await repository.markNotificationProcessed(orderId, notification)
      return Response.json({ accepted: true, orderId, orderStatus })
    }
    if (paymentStatus === 'SUCCEEDED' && notification.status_code === '200') {
      const finalization = await serverlessCheckoutService().finalizeHold({
        eventId: order.eventId,
        tierId: order.tierId,
        userId: order.userId,
        orderId,
        outcome: 'SUCCESS',
      })
      if (finalization === 'ALREADY_RELEASED') {
        await repository.markReviewRequired(orderId, notification.transaction_id)
        orderStatus = 'PAYMENT_REVIEW_REQUIRED'
      } else {
        orderStatus = await repository.markPaid(order, notification.transaction_id)
      }
    } else if (failedPayment) {
      const finalization = await serverlessCheckoutService().finalizeHold({
        eventId: order.eventId,
        tierId: order.tierId,
        userId: order.userId,
        orderId,
        outcome: 'FAILURE',
      })
      if (finalization === 'ALREADY_SUCCESS') {
        await repository.markReviewRequired(orderId, notification.transaction_id)
        orderStatus = 'PAYMENT_REVIEW_REQUIRED'
      } else {
        await repository.markFailed(orderId, notification.transaction_id)
        orderStatus = 'FAILED'
      }
    }
    await repository.markNotificationProcessed(orderId, notification)
    return Response.json({ accepted: true, orderId, orderStatus })
  } catch (error) {
    return apiError(error, request)
  }
}
