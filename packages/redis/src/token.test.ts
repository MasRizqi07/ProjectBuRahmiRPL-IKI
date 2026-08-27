import { describe, expect, it, vi } from 'vitest'
import { signAdmissionToken, verifyAdmissionToken } from './token'

const secret = 'test-signing-secret-that-is-long-enough'
const claims = {
  v: 1 as const,
  jti: '01987654-3210-7abc-8def-0123456789ab',
  salesSessionId: '11111111-1111-4111-8111-111111111111',
  entryId: '22222222-2222-4222-8222-222222222222',
  userId: '33333333-3333-4333-8333-333333333333',
  expiresAtEpochSeconds: 2_000_000_000,
}

describe('admission tokens', () => {
  it('round-trips authenticated claims', () => {
    expect(verifyAdmissionToken(signAdmissionToken(claims, secret), secret)).toEqual(claims)
  })

  it('rejects a payload modified after signing', () => {
    const token = signAdmissionToken(claims, secret)
    const [payload, signature] = token.split('.')
    const changedPayload = Buffer.from(
      JSON.stringify({ ...claims, userId: '44444444-4444-4444-8444-444444444444' }),
    ).toString('base64url')
    expect(() => verifyAdmissionToken(`${changedPayload}.${signature ?? payload}`, secret)).toThrow(
      'signature is invalid',
    )
  })

  it('rejects an expired token', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2035-01-01T00:00:00Z'))
    expect(() => verifyAdmissionToken(signAdmissionToken(claims, secret), secret)).toThrow(
      'Admission token has expired',
    )
    vi.useRealTimers()
  })
})
