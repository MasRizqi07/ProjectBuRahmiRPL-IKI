import { createHash } from 'node:crypto'
import { describe, expect, it } from 'vitest'
import { verifyMidtransSignature } from './midtrans'

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
