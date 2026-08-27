import { z } from 'zod'

export const uuidSchema = z.string().uuid()
export const idempotencyKeySchema = z.string().trim().min(16).max(128)
export const moneySchema = z.number().int().nonnegative().safe()

export const queueStateSchema = z.enum([
  'PRE_QUEUE',
  'WAITING',
  'ADMITTED',
  'CONSUMED',
  'EXPIRED',
  'PAUSED',
])

export const queueJoinRequestSchema = z.object({
  salesSessionId: uuidSchema,
})

export const queueJoinResponseSchema = z.object({
  entryId: uuidSchema,
  salesSessionId: uuidSchema,
  state: queueStateSchema,
  position: z.number().int().positive().nullable(),
  estimatedWaitSeconds: z.number().int().nonnegative().nullable(),
  pollAfterMs: z.number().int().min(1_000).max(30_000),
})

export const queueStatusResponseSchema = queueJoinResponseSchema.extend({
  admissionToken: z.string().min(32).optional(),
  admissionExpiresAt: z.string().datetime().optional(),
})

const generalAdmissionItemSchema = z.object({
  kind: z.literal('GENERAL_ADMISSION'),
  ticketTypeId: uuidSchema,
  quantity: z.number().int().min(1).max(4),
})

const assignedSeatItemSchema = z.object({
  kind: z.literal('ASSIGNED_SEAT'),
  eventSeatIds: z.array(uuidSchema).min(1).max(4),
})

export const reservationItemRequestSchema = z.discriminatedUnion('kind', [
  generalAdmissionItemSchema,
  assignedSeatItemSchema,
])

export const createReservationRequestSchema = z
  .object({
    salesSessionId: uuidSchema,
    admissionToken: z.string().min(32),
    items: z.array(reservationItemRequestSchema).min(1).max(4),
  })
  .superRefine((request, context) => {
    const ticketCount = request.items.reduce(
      (total, item) =>
        total +
        (item.kind === 'GENERAL_ADMISSION'
          ? item.quantity
          : item.eventSeatIds.length),
      0,
    )

    if (ticketCount > 4) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'An order may contain at most four tickets',
        path: ['items'],
      })
    }
  })

export const reservationStatusSchema = z.enum([
  'HELD',
  'CHECKOUT_PENDING',
  'CONFIRMED',
  'EXPIRED',
  'RELEASED',
])

export const reservationResponseSchema = z.object({
  id: uuidSchema,
  status: reservationStatusSchema,
  expiresAt: z.string().datetime(),
  subtotal: moneySchema,
  serviceFee: moneySchema,
  total: moneySchema,
  currency: z.literal('IDR'),
})

export const salesInventoryResponseSchema = z.object({
  salesSessionId: uuidSchema,
  event: z.object({ id: uuidSchema, title: z.string(), startsAt: z.string().datetime() }),
  ticketTypes: z.array(
    z.object({
      id: uuidSchema,
      code: z.string(),
      name: z.string(),
      mode: z.enum(['GENERAL_ADMISSION', 'ASSIGNED_SEAT']),
      price: moneySchema,
      available: z.number().int().nonnegative(),
    }),
  ),
  seats: z.array(
    z.object({
      id: uuidSchema,
      ticketTypeId: uuidSchema,
      section: z.string(),
      row: z.string(),
      number: z.string(),
      price: moneySchema,
      available: z.boolean(),
    }),
  ),
})

export const reservationDetailResponseSchema = reservationResponseSchema.extend({
  eventTitle: z.string(),
  items: z.array(
    z.object({
      label: z.string(),
      quantity: z.number().int().positive(),
      unitPrice: moneySchema,
    }),
  ),
})

export const buyerDetailsSchema = z.object({
  fullName: z.string().trim().min(2).max(100),
  email: z.string().trim().email().max(254),
  phone: z.string().trim().regex(/^\+?[1-9]\d{7,14}$/),
  nik: z.string().regex(/^\d{16}$/).optional(),
  consentToStoreNik: z.literal(true).optional(),
})

export const createCheckoutRequestSchema = z
  .object({
    reservationId: uuidSchema,
    buyer: buyerDetailsSchema,
  })
  .superRefine(({ buyer }, context) => {
    if (buyer.nik !== undefined && buyer.consentToStoreNik !== true) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Explicit consent is required when NIK is provided',
        path: ['buyer', 'consentToStoreNik'],
      })
    }
  })

export const orderStatusSchema = z.enum([
  'PENDING_PAYMENT',
  'PAID',
  'CANCELLED',
  'EXPIRED',
  'PAYMENT_REVIEW_REQUIRED',
  'REFUNDED',
])

export const paymentStatusSchema = z.enum([
  'INITIATING',
  'PENDING',
  'AUTHORIZED',
  'SUCCEEDED',
  'DENIED',
  'EXPIRED',
  'CANCELLED',
  'REFUNDED',
  'UNKNOWN',
])

export const checkoutResponseSchema = z.object({
  orderId: uuidSchema,
  orderStatus: orderStatusSchema,
  paymentStatus: paymentStatusSchema,
  paymentToken: z.string().nullable(),
  redirectUrl: z.string().url().nullable(),
  retryAfterMs: z.number().int().min(250).max(10_000).nullable(),
})

export const midtransNotificationSchema = z
  .object({
    order_id: z.string().min(1).max(128),
    transaction_id: z.string().min(1).max(128),
    status_code: z.string().min(3).max(3),
    gross_amount: z.string().regex(/^\d+(?:\.\d{1,2})?$/),
    transaction_status: z.string().min(1).max(64),
    fraud_status: z.string().max(64).optional(),
    payment_type: z.string().max(64).optional(),
    signature_key: z.string().min(64),
    merchant_id: z.string().min(1).max(64),
  })
  .passthrough()

export const apiErrorSchema = z.object({
  error: z.object({
    code: z.string(),
    message: z.string(),
    requestId: z.string(),
    retryable: z.boolean(),
    details: z.record(z.unknown()).optional(),
  }),
})

export type QueueState = z.infer<typeof queueStateSchema>
export type QueueJoinRequest = z.infer<typeof queueJoinRequestSchema>
export type QueueJoinResponse = z.infer<typeof queueJoinResponseSchema>
export type QueueStatusResponse = z.infer<typeof queueStatusResponseSchema>
export type ReservationItemRequest = z.infer<typeof reservationItemRequestSchema>
export type CreateReservationRequest = z.infer<typeof createReservationRequestSchema>
export type ReservationStatus = z.infer<typeof reservationStatusSchema>
export type ReservationResponse = z.infer<typeof reservationResponseSchema>
export type SalesInventoryResponse = z.infer<typeof salesInventoryResponseSchema>
export type ReservationDetailResponse = z.infer<typeof reservationDetailResponseSchema>
export type BuyerDetails = z.infer<typeof buyerDetailsSchema>
export type CreateCheckoutRequest = z.infer<typeof createCheckoutRequestSchema>
export type CheckoutResponse = z.infer<typeof checkoutResponseSchema>
export type OrderStatus = z.infer<typeof orderStatusSchema>
export type PaymentStatus = z.infer<typeof paymentStatusSchema>
export type MidtransNotification = z.infer<typeof midtransNotificationSchema>
