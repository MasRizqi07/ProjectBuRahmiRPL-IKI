import { describe, expect, it } from 'vitest'
import { holdCreatedResponseSchema, reserveRequestSchema } from './contracts'

describe('serverless checkout contracts', () => {
  it('limits each hold to four tickets', () => {
    expect(reserveRequestSchema.safeParse({ qty: 4 }).success).toBe(true)
    expect(reserveRequestSchema.safeParse({ qty: 5 }).success).toBe(false)
  })

  it('requires a complete durable hold response', () => {
    const result = holdCreatedResponseSchema.safeParse({
      status: 'HOLD_CREATED',
      orderId: '11111111-1111-4111-8111-111111111111',
      providerOrderId: 'WT-EDGE-1',
      eventId: '22222222-2222-4222-8222-222222222222',
      tierId: '33333333-3333-4333-8333-333333333333',
      tierName: 'Festival',
      quantity: 2,
      unitPrice: 500_000,
      total: 1_000_000,
      currency: 'IDR',
      remaining: 98,
      holdExpiresAt: '2030-01-01T00:10:00.000Z',
    })
    expect(result.success).toBe(true)
  })
})
