import { describe, expect, it, vi, beforeEach } from 'vitest'
import { POST } from './route'
import crypto from 'node:crypto'

const mockMarkPaid = vi.fn()
const mockMarkFailed = vi.fn()
const mockApplyNotification = vi.fn()
const mockGetNotificationContext = vi.fn()

vi.mock('@/lib/server/runtime', () => ({
  paymentRepository: () => ({
    getNotificationContext: mockGetNotificationContext,
    applyNotification: mockApplyNotification,
  }),
  edgeCheckoutRepository: () => ({
    markPaid: mockMarkPaid,
    markFailed: mockMarkFailed,
  }),
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  },
}))

describe('POST /api/v1/payments/midtrans/webhook', () => {
  const serverKey = 'test-merchant-server-key-32chars!!'
  const edgeOrderId = '11111111-1111-4111-8111-111111111111'
  const providerOrderId = 'WT-EDGE-1111111141118111'
  const statusCode = '200'
  const grossAmount = '350000.00'

  function computeSignature(orderId: string, status: string, amount: string, key: string): string {
    return crypto
      .createHash('sha512')
      .update(`${orderId}${status}${amount}${key}`)
      .digest('hex')
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('rejects forged webhook notifications with 403 Forbidden', async () => {
    mockGetNotificationContext.mockResolvedValueOnce({
      isEdge: true,
      tenantId: '11111111-1111-4111-8111-111111111111',
      edgeOrderId,
      userId: 'user-uuid-1',
      eventId: 'event-uuid-1',
      tierId: 'tier-uuid-1',
      quantity: 1,
      amount: 350_000,
      status: 'HELD',
      serverKey,
      production: false,
    })

    const payload = {
      order_id: providerOrderId,
      status_code: statusCode,
      gross_amount: grossAmount,
      transaction_status: 'settlement',
      transaction_id: 'midtrans-tx-001',
      signature_key: '0'.repeat(128),
      payment_type: 'qris',
      merchant_id: 'G123456789',
      transaction_time: new Date().toISOString(),
    }

    const request = new Request('http://localhost:3000/api/v1/payments/midtrans/webhook', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })

    const response = await POST(request)
    expect(response.status).toBe(403)
    const body = (await response.json()) as { error: { code: string } }
    expect(body.error.code).toBe('FORBIDDEN')
    expect(mockMarkPaid).not.toHaveBeenCalled()
  })

  it('accepts validly-signed webhook for an edge order and marks it PAID', async () => {
    mockGetNotificationContext.mockResolvedValueOnce({
      isEdge: true,
      tenantId: '11111111-1111-4111-8111-111111111111',
      edgeOrderId,
      userId: 'user-uuid-1',
      eventId: 'event-uuid-1',
      tierId: 'tier-uuid-1',
      quantity: 2,
      amount: 700_000,
      status: 'HELD',
      serverKey,
      production: false,
    })
    mockMarkPaid.mockResolvedValueOnce('PAID')

    const validSignature = computeSignature(providerOrderId, statusCode, grossAmount, serverKey)
    const payload = {
      order_id: providerOrderId,
      status_code: statusCode,
      gross_amount: grossAmount,
      transaction_status: 'settlement',
      transaction_id: 'midtrans-tx-002',
      signature_key: validSignature,
      payment_type: 'bank_transfer',
      merchant_id: 'G123456789',
      transaction_time: new Date().toISOString(),
    }

    const request = new Request('http://localhost:3000/api/v1/payments/midtrans/webhook', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })

    const response = await POST(request)
    expect(response.status).toBe(200)
    const body = (await response.json()) as { accepted: boolean }
    expect(body).toEqual({ accepted: true })

    expect(mockMarkPaid).toHaveBeenCalledOnce()
    expect(mockMarkPaid).toHaveBeenCalledWith(
      {
        orderId: edgeOrderId,
        userId: 'user-uuid-1',
        eventId: 'event-uuid-1',
        tierId: 'tier-uuid-1',
        providerOrderId,
        quantity: 2,
        amount: 700_000,
        status: 'HELD',
      },
      'midtrans-tx-002',
    )
    expect(mockApplyNotification).not.toHaveBeenCalled()
  })

  it('delegates legacy orders to legacy applyNotification without calling markPaid', async () => {
    mockGetNotificationContext.mockResolvedValueOnce({
      isEdge: false,
      tenantId: '11111111-1111-4111-8111-111111111111',
      paymentAttemptId: 'attempt-uuid-legacy',
      serverKey,
      production: false,
    })
    mockApplyNotification.mockResolvedValueOnce(true)

    const legacyOrderId = 'LEGACY-ORDER-123'
    const validSignature = computeSignature(legacyOrderId, statusCode, grossAmount, serverKey)
    const payload = {
      order_id: legacyOrderId,
      status_code: statusCode,
      gross_amount: grossAmount,
      transaction_status: 'settlement',
      transaction_id: 'midtrans-tx-legacy',
      signature_key: validSignature,
      payment_type: 'credit_card',
      merchant_id: 'G123456789',
      transaction_time: new Date().toISOString(),
    }

    const request = new Request('http://localhost:3000/api/v1/payments/midtrans/webhook', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })

    const response = await POST(request)
    expect(response.status).toBe(200)
    expect(mockApplyNotification).toHaveBeenCalledOnce()
    expect(mockMarkPaid).not.toHaveBeenCalled()
  })
})
