export type DomainErrorCode =
  | 'ADMISSION_REQUIRED'
  | 'ADMISSION_EXPIRED'
  | 'CONFLICT'
  | 'FORBIDDEN'
  | 'IDEMPOTENCY_CONFLICT'
  | 'INTERNAL_ERROR'
  | 'INSUFFICIENT_INVENTORY'
  | 'INVALID_STATE_TRANSITION'
  | 'NOT_FOUND'
  | 'PAYMENT_PROVIDER_UNAVAILABLE'
  | 'RATE_LIMITED'
  | 'RESERVATION_EXPIRED'
  | 'SERVICE_UNAVAILABLE'
  | 'TENANT_BOUNDARY_VIOLATION'
  | 'UNAUTHORIZED'
  | 'VALIDATION_ERROR'

const statusByCode: Record<DomainErrorCode, number> = {
  ADMISSION_REQUIRED: 403,
  ADMISSION_EXPIRED: 410,
  CONFLICT: 409,
  FORBIDDEN: 403,
  IDEMPOTENCY_CONFLICT: 409,
  INTERNAL_ERROR: 500,
  INSUFFICIENT_INVENTORY: 409,
  INVALID_STATE_TRANSITION: 409,
  NOT_FOUND: 404,
  PAYMENT_PROVIDER_UNAVAILABLE: 503,
  RATE_LIMITED: 429,
  RESERVATION_EXPIRED: 410,
  SERVICE_UNAVAILABLE: 503,
  TENANT_BOUNDARY_VIOLATION: 403,
  UNAUTHORIZED: 401,
  VALIDATION_ERROR: 400,
}

export class DomainError extends Error {
  readonly code: DomainErrorCode
  readonly status: number
  readonly retryable: boolean
  readonly details: Readonly<Record<string, unknown>> | undefined

  constructor(
    code: DomainErrorCode,
    message: string,
    options: {
      retryable?: boolean
      details?: Readonly<Record<string, unknown>>
      cause?: unknown
    } = {},
  ) {
    super(message, { cause: options.cause })
    this.name = 'DomainError'
    this.code = code
    this.status = statusByCode[code]
    this.retryable = options.retryable ?? false
    this.details = options.details
  }
}
