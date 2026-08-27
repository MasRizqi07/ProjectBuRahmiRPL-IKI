import { createHmac, timingSafeEqual } from 'node:crypto'
import { z } from 'zod'
import { DomainError } from '@war-ticket/domain'

const admissionClaimsSchema = z.object({
  v: z.literal(1),
  jti: z.string().min(16),
  salesSessionId: z.string().uuid(),
  entryId: z.string().uuid(),
  userId: z.string().uuid(),
  expiresAtEpochSeconds: z.number().int().positive(),
})

export type AdmissionClaims = z.infer<typeof admissionClaimsSchema>

function signature(payload: string, secret: string): Buffer {
  return createHmac('sha256', secret).update(payload).digest()
}

export function signAdmissionToken(claims: AdmissionClaims, secret: string): string {
  const payload = Buffer.from(JSON.stringify(claims)).toString('base64url')
  return `${payload}.${signature(payload, secret).toString('base64url')}`
}

export function verifyAdmissionToken(token: string, secret: string): AdmissionClaims {
  const [payload, encodedSignature, extra] = token.split('.')
  if (payload === undefined || encodedSignature === undefined || extra !== undefined) {
    throw new DomainError('ADMISSION_REQUIRED', 'Admission token is malformed')
  }

  const actual = Buffer.from(encodedSignature, 'base64url')
  const expected = signature(payload, secret)
  if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) {
    throw new DomainError('ADMISSION_REQUIRED', 'Admission token signature is invalid')
  }

  let decoded: unknown
  try {
    decoded = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'))
  } catch (error) {
    throw new DomainError('ADMISSION_REQUIRED', 'Admission token payload is invalid', {
      cause: error,
    })
  }

  const claims = admissionClaimsSchema.parse(decoded)
  if (claims.expiresAtEpochSeconds <= Math.floor(Date.now() / 1_000)) {
    throw new DomainError('ADMISSION_EXPIRED', 'Admission token has expired')
  }
  return claims
}
