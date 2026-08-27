import { apiErrorSchema } from '@war-ticket/contracts'

export class ApiClientError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly code: string,
    readonly retryable: boolean,
  ) {
    super(message)
    this.name = 'ApiClientError'
  }
}

export async function apiJson(input: RequestInfo | URL, init?: RequestInit): Promise<unknown> {
  const response = await fetch(input, {
    ...init,
    headers: {
      accept: 'application/json',
      ...(init?.body === undefined ? {} : { 'content-type': 'application/json' }),
      ...init?.headers,
    },
  })
  const body: unknown = await response.json().catch(() => null)
  if (!response.ok) {
    const parsed = apiErrorSchema.safeParse(body)
    if (parsed.success) {
      throw new ApiClientError(
        parsed.data.error.message,
        response.status,
        parsed.data.error.code,
        parsed.data.error.retryable,
      )
    }
    throw new ApiClientError('Server tidak dapat memproses permintaan', response.status, 'UNKNOWN', response.status >= 500)
  }
  return body
}
