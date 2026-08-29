import { ZodError, type ZodType } from 'zod'
import { DomainError } from '@war-ticket/domain'
import { requestId as createRequestId } from '@war-ticket/observability'
import { createClient } from '@/lib/supabase/server'
import { isSupabaseConfigured } from '@/lib/supabase/config'
export { requirePlatformRole, requireTenantPermission } from '@/lib/auth/authorization'
import { config, logger } from './runtime'

export interface AuthenticatedUser {
  readonly id: string
}

export async function requireUser(): Promise<AuthenticatedUser> {
  if (!isSupabaseConfigured()) {
    throw new DomainError('SERVICE_UNAVAILABLE', 'Authentication service is not configured')
  }
  const supabase = await createClient()
  const { data, error } = await supabase.auth.getClaims()
  const subject = data?.claims.sub
  if (error !== null || typeof subject !== 'string' || subject.length === 0) {
    throw new DomainError('UNAUTHORIZED', 'Authentication is required')
  }
  return { id: subject }
}

export async function parseJson<T>(request: Request, schema: ZodType<T>): Promise<T> {
  let input: unknown
  try {
    input = await request.json()
  } catch (error) {
    throw new DomainError('VALIDATION_ERROR', 'Request body must be valid JSON', {
      cause: error,
    })
  }
  return schema.parse(input)
}

export function assertSameOrigin(request: Request): void {
  const origin = request.headers.get('origin')
  const allowedOrigin = new URL(config().NEXT_PUBLIC_APP_URL).origin
  if (origin === null || origin !== allowedOrigin) {
    throw new DomainError('FORBIDDEN', 'Cross-origin state change is not allowed')
  }
}

export function apiError(error: unknown, request: Request): Response {
  const requestId = createRequestId(request.headers.get('x-request-id'))
  if (error instanceof ZodError) {
    return Response.json(
      {
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Request validation failed',
          requestId,
          retryable: false,
          details: { fields: error.flatten().fieldErrors },
        },
      },
      { status: 400, headers: { 'x-request-id': requestId } },
    )
  }
  if (error instanceof DomainError) {
    logger.warn('api_request_failed', {
      requestId,
      code: error.code,
      status: error.status,
      path: new URL(request.url).pathname,
    })
    return Response.json(
      {
        error: {
          code: error.code,
          message: error.message,
          requestId,
          retryable: error.retryable,
          ...(error.details === undefined ? {} : { details: error.details }),
        },
      },
      { status: error.status, headers: { 'x-request-id': requestId } },
    )
  }
  logger.error('unhandled_api_error', {
    requestId,
    path: new URL(request.url).pathname,
    error: error instanceof Error ? { name: error.name, message: error.message } : String(error),
  })
  return Response.json(
    {
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred',
        requestId,
        retryable: true,
      },
    },
    { status: 500, headers: { 'x-request-id': requestId } },
  )
}
