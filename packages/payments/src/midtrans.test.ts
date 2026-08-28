import { createHash } from 'node:crypto'
import { describe, expect, it, vi } from 'vitest'
import { resolveMidtransPaymentStatus, verifyMidtransSignature } from './midtrans'

const notification = {
  order_id: 'WT-123',
  transaction_id: 'trx-notification',
  status_code: '201',
  gross_amount: '100000.00',
  transaction_status: 'pending',
  signature_key: '00'.repeat(64),
  merchant_id: 'M123',
}

describe('verifyMidtransSignature', () => {
  it('verifies the documented SHA-512 notification signature', () => {
    const serverKey = 'sandbox-server-key'
    const input = {
      order_id: 'WT-123',
      status_code: '200',
      gross_amount: '100000.00',
    }
    const signature_key = createHash('sha512')
      .update(`${input.order_id}${input.status_code}${input.gross_amount}${serverKey}`)
      .digest('hex')
    expect(verifyMidtransSignature({ ...input, signature_key }, serverKey)).toBe(true)
  })

  it('rejects a forged signature', () => {
    expect(
      verifyMidtransSignature(
        {
          order_id: 'WT-123',
          status_code: '200',
          gross_amount: '100000.00',
          signature_key: '00'.repeat(64),
        },
        'sandbox-server-key',
      ),
    ).toBe(false)
  })
})

describe('resolveMidtransPaymentStatus', () => {
  it('reconciles an ambiguous notification through the status API', async () => {
    const getStatus = vi.fn().mockResolvedValue({
      order_id: 'WT-123',
      transaction_id: 'trx-current',
      transaction_status: 'settlement',
      status_code: '200',
      gross_amount: '100000.00',
      fraud_status: 'accept',
    })

    await expect(resolveMidtransPaymentStatus({
      notification,
      providerOrderId: 'WT-123',
      expectedAmount: 100_000,
      client: { getStatus },
    })).resolves.toEqual({
      paymentStatus: 'SUCCEEDED',
      statusCode: '200',
      transactionId: 'trx-current',
      reconciled: true,
    })
    expect(getStatus).toHaveBeenCalledOnce()
  })

  it('does not call the status API for a terminal notification', async () => {
    const getStatus = vi.fn()
    const terminal = { ...notification, status_code: '200', transaction_status: 'settlement' }

    await expect(resolveMidtransPaymentStatus({
      notification: terminal,
      providerOrderId: 'WT-123',
      expectedAmount: 100_000,
      client: { getStatus },
    })).resolves.toMatchObject({ paymentStatus: 'SUCCEEDED', reconciled: false })
    expect(getStatus).not.toHaveBeenCalled()
  })

  it('rejects a reconciled amount that does not match the order', async () => {
    const getStatus = vi.fn().mockResolvedValue({
      order_id: 'WT-123',
      transaction_id: 'trx-current',
      transaction_status: 'settlement',
      status_code: '200',
      gross_amount: '1.00',
    })

    await expect(resolveMidtransPaymentStatus({
      notification,
      providerOrderId: 'WT-123',
      expectedAmount: 100_000,
      client: { getStatus },
    })).rejects.toMatchObject({ code: 'CONFLICT' })
  })
})
