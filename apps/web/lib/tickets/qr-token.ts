import { createHash, createHmac, randomUUID, timingSafeEqual } from 'node:crypto'
import { DomainError } from '@war-ticket/domain'

interface TicketQrClaims {
  readonly v: 1
  readonly jti: string
  readonly ticketId: string
  readonly exp: number
}

function secret(): string {
  const value = process.env.TICKET_QR_SIGNING_SECRET
  if (!value || value.length < 32 || value.startsWith('replace-')) {
    throw new DomainError('PAYMENT_PROVIDER_UNAVAILABLE', 'Dynamic ticket QR is not configured')
  }
  return value
}

export function issueTicketQrToken(ticketId: string, lifetimeSeconds = 45): {
  readonly token: string
  readonly tokenHash: string
  readonly expiresAt: Date
} {
  const expiresAt = new Date(Date.now() + lifetimeSeconds * 1_000)
  const claims: TicketQrClaims = {
    v: 1,
    jti: randomUUID(),
    ticketId,
    exp: Math.floor(expiresAt.getTime() / 1_000),
  }
  const payload = Buffer.from(JSON.stringify(claims)).toString('base64url')
  const signature = createHmac('sha256', secret()).update(payload).digest('base64url')
  const token = `${payload}.${signature}`
  return { token, tokenHash: hashTicketQrToken(token), expiresAt }
}

export function verifyTicketQrToken(token: string): TicketQrClaims {
  const [payload, providedSignature, extra] = token.split('.')
  if (!payload || !providedSignature || extra) throw new DomainError('VALIDATION_ERROR', 'QR token format is invalid')
  const expected = createHmac('sha256', secret()).update(payload).digest()
  let provided: Buffer
  try {
    provided = Buffer.from(providedSignature, 'base64url')
  } catch {
    throw new DomainError('VALIDATION_ERROR', 'QR token signature is invalid')
  }
  if (provided.length !== expected.length || !timingSafeEqual(provided, expected)) {
    throw new DomainError('FORBIDDEN', 'QR token signature is invalid')
  }
  const claims = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')) as Partial<TicketQrClaims>
  if (claims.v !== 1 || typeof claims.jti !== 'string' || typeof claims.ticketId !== 'string' || typeof claims.exp !== 'number') {
    throw new DomainError('VALIDATION_ERROR', 'QR token claims are invalid')
  }
  if (claims.exp <= Math.floor(Date.now() / 1_000)) throw new DomainError('NOT_FOUND', 'QR token is expired')
  return claims as TicketQrClaims
}

export function hashTicketQrToken(token: string): string {
  return createHash('sha256').update(token).digest('hex')
}
