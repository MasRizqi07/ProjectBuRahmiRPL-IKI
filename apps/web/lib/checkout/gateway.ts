import type {
  CheckoutResponse,
  CreateCheckoutRequest,
  CreateReservationRequest,
  MidtransNotification,
  QueueJoinResponse,
  QueueStatusResponse,
  ReservationDetailResponse,
  ReservationResponse,
  SalesInventoryResponse,
} from '@war-ticket/contracts'
import { DomainError } from '@war-ticket/domain'
import { verifyMidtransSignature } from '@war-ticket/payments'
import type {
  CatalogRepository,
  CheckoutRepository,
  InventoryRepository,
  PaymentRepository,
} from '@war-ticket/database'
import type { QueueService } from '@war-ticket/redis'

export interface CheckoutGateway {
  activeSalesSession(eventId: string): Promise<{ readonly id: string; readonly title: string }>
  joinQueue(eventId: string, userId: string): Promise<QueueJoinResponse>
  queueStatus(eventId: string, userId: string): Promise<QueueStatusResponse>
  inventory(eventId: string): Promise<SalesInventoryResponse>
  reserve(eventId: string, userId: string, request: CreateReservationRequest): Promise<ReservationResponse>
  reservation(reservationId: string, userId: string): Promise<ReservationDetailResponse>
  checkout(userId: string, idempotencyKey: string, request: CreateCheckoutRequest): Promise<CheckoutResponse>
  orderStatus(orderId: string, userId: string): Promise<CheckoutResponse>
  acceptMidtransNotification(notification: MidtransNotification): Promise<boolean>
}

export class CanonicalCheckoutGateway implements CheckoutGateway {
  constructor(
    private readonly catalog: CatalogRepository,
    private readonly inventoryRepository: InventoryRepository,
    private readonly checkoutRepository: CheckoutRepository,
    private readonly paymentRepository: PaymentRepository,
    private readonly queue: QueueService,
  ) {}

  activeSalesSession(eventId: string): Promise<{ readonly id: string; readonly title: string }> {
    return this.catalog.getActiveSalesSession(eventId)
  }

  async joinQueue(eventId: string, userId: string): Promise<QueueJoinResponse> {
    const session = await this.activeSalesSession(eventId)
    await this.catalog.assertSalesSessionEligible(session.id, userId)
    return this.queue.join(session.id, userId)
  }

  async queueStatus(eventId: string, userId: string): Promise<QueueStatusResponse> {
    const session = await this.activeSalesSession(eventId)
    await this.catalog.assertSalesSessionEligible(session.id, userId)
    return this.queue.getStatus(session.id, userId)
  }

  async inventory(eventId: string): Promise<SalesInventoryResponse> {
    const session = await this.activeSalesSession(eventId)
    return this.catalog.getSalesInventory(session.id)
  }

  async reserve(eventId: string, userId: string, request: CreateReservationRequest): Promise<ReservationResponse> {
    const session = await this.activeSalesSession(eventId)
    if (request.salesSessionId !== session.id) {
      throw new DomainError('TENANT_BOUNDARY_VIOLATION', 'Sales session does not belong to the requested event')
    }
    const admission = this.queue.validateAdmissionToken({
      token: request.admissionToken,
      salesSessionId: request.salesSessionId,
      userId,
    })
    const result = await this.inventoryRepository.createReservation({
      ...request,
      userId,
      admissionEntryId: admission.entryId,
    })
    try {
      await this.queue.consumeAdmissionToken({
        token: request.admissionToken,
        salesSessionId: request.salesSessionId,
        userId,
      })
    } catch {
      // PostgreSQL's unique admission barrier is authoritative; Redis is reconstructible.
    }
    return result
  }

  reservation(reservationId: string, userId: string): Promise<ReservationDetailResponse> {
    return this.catalog.getReservation(reservationId, userId)
  }

  checkout(userId: string, idempotencyKey: string, request: CreateCheckoutRequest): Promise<CheckoutResponse> {
    return this.checkoutRepository.createCheckout({ ...request, userId, idempotencyKey })
  }

  orderStatus(orderId: string, userId: string): Promise<CheckoutResponse> {
    return this.paymentRepository.getCheckoutStatus(orderId, userId)
  }

  async acceptMidtransNotification(notification: MidtransNotification): Promise<boolean> {
    const context = await this.paymentRepository.getNotificationContext(notification.order_id)
    if (!verifyMidtransSignature(notification, context.serverKey)) {
      throw new DomainError('FORBIDDEN', 'Payment notification signature is invalid')
    }
    return this.paymentRepository.applyNotification(notification)
  }
}
