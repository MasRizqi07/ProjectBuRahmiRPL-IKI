import { z } from 'zod'

export const reserveRequestSchema = z.object({
  tierId: z.string().uuid().optional(),
  qty: z.number().int().min(1).max(4),
})

export const queueStateSchema = z.enum([
  'WAITING',
  'ADMITTED',
  'HOLD_CREATED',
  'COMPLETED',
  'RELEASED',
  'EXPIRED',
])

export const queueResponseSchema = z.object({
  eventId: z.string().uuid(),
  state: queueStateSchema,
  rank: z.number().int().nonnegative(),
  position: z.number().int().positive(),
  pollAfterMs: z.number().int().positive(),
})

export const holdCreatedResponseSchema = z.object({
  status: z.literal('HOLD_CREATED'),
  orderId: z.string().uuid(),
  providerOrderId: z.string(),
  eventId: z.string().uuid(),
  tierId: z.string().uuid(),
  tierName: z.string(),
  quantity: z.number().int().positive(),
  unitPrice: z.number().int().nonnegative(),
  total: z.number().int().nonnegative(),
  currency: z.literal('IDR'),
  remaining: z.number().int().nonnegative(),
  holdExpiresAt: z.string().datetime(),
})

export const soldOutResponseSchema = z.object({
  status: z.literal('SOLD_OUT'),
  remaining: z.number().int().nonnegative(),
})

export const reserveResponseSchema = z.union([
  holdCreatedResponseSchema,
  soldOutResponseSchema,
])

export type ReserveRequest = z.infer<typeof reserveRequestSchema>
export type QueueResponse = z.infer<typeof queueResponseSchema>
export type HoldCreatedResponse = z.infer<typeof holdCreatedResponseSchema>
export type ReserveResponse = z.infer<typeof reserveResponseSchema>
