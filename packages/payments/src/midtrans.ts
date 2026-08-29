import { createHash, timingSafeEqual } from 'node:crypto'
import { z } from 'zod'
import type { MidtransNotification, PaymentStatus } from '@war-ticket/contracts'
import { DomainError, mapMidtransStatus } from '@war-ticket/domain'

const snapResponseSchema = z.object({
  token: z.string().min(1),
  redirect_url: z.string().url(),
})

const transactionStatusSchema = z.object({
  order_id: z.string(),
  transaction_id: z.string().optional(),
  transaction_status: z.string(),
  status_code: z.string(),
  gross_amount: z.string(),
  fraud_status: z.string().optional(),
  signature_key: z.string().optional(),
})

const refundResponseSchema = z.object({
  status_code: z.string(),
  status_message: z.string(),
  transaction_id: z.string(),
  order_id: z.string(),
  transaction_status: z.enum(['refund', 'partial_refund']),
  refund_key: z.string(),
  refund_amount: z.string(),
})

export type MidtransTransactionStatus = z.infer<typeof transactionStatusSchema>

export interface MidtransStatusClient {
  getStatus(providerOrderId: string): Promise<MidtransTransactionStatus>
}

export interface MidtransPaymentResolution {
  readonly paymentStatus: PaymentStatus
  readonly statusCode: string
  readonly transactionId: string
  readonly reconciled: boolean
}

export interface MidtransLineItem {
  readonly id: string
  readonly name: string
  readonly price: number
  readonly quantity: number
}

export interface MidtransPaymentRequest {
  readonly providerOrderId: string
  readonly amount: number
  readonly customer: {
    readonly name: string
    readonly email: string
    readonly phone: string
  }
  readonly items: readonly MidtransLineItem[]
  readonly expiresInSeconds: number
}

export interface MidtransPaymentSession {
  readonly token: string
  readonly redirectUrl: string
}

function baseUrl(production: boolean): string {
  return production
    ? 'https://app.midtrans.com'
    : 'https://app.sandbox.midtrans.com'
}

function apiBaseUrl(production: boolean): string {
  return production
    ? 'https://api.midtrans.com'
    : 'https://api.sandbox.midtrans.com'
}

function authorization(serverKey: string): string {
  return `Basic ${Buffer.from(`${serverKey}:`).toString('base64')}`
}

async function responseJson(response: Response): Promise<unknown> {
  const text = await response.text()
  try {
    return JSON.parse(text) as unknown
  } catch {
    return { status_message: text.slice(0, 500) }
  }
}

export class MidtransClient {
  constructor(
    private readonly serverKey: string,
    private readonly production: boolean,
  ) {}

  async createPayment(request: MidtransPaymentRequest): Promise<MidtransPaymentSession> {
    const itemTotal = request.items.reduce(
      (total, item) => total + item.price * item.quantity,
      0,
    )
    if (itemTotal !== request.amount) {
      throw new DomainError('CONFLICT', 'Midtrans item total does not match order amount')
    }

    let response: Response
    try {
      response = await fetch(`${baseUrl(this.production)}/snap/v1/transactions`, {
        method: 'POST',
        headers: {
          accept: 'application/json',
          authorization: authorization(this.serverKey),
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          transaction_details: {
            order_id: request.providerOrderId,
            gross_amount: request.amount,
          },
          item_details: request.items,
          customer_details: {
            first_name: request.customer.name,
            email: request.customer.email,
            phone: request.customer.phone,
          },
          expiry: {
            unit: 'seconds',
            duration: request.expiresInSeconds,
          },
        }),
        signal: AbortSignal.timeout(5_000),
      })
    } catch (error) {
      throw new DomainError('PAYMENT_PROVIDER_UNAVAILABLE', 'Midtrans request failed', {
        retryable: true,
        cause: error,
      })
    }

    const body = await responseJson(response)
    if (!response.ok) {
      throw new DomainError('PAYMENT_PROVIDER_UNAVAILABLE', 'Midtrans rejected payment creation', {
        retryable: response.status >= 500,
        details: { status: response.status },
      })
    }
    const parsed = snapResponseSchema.parse(body)
    return { token: parsed.token, redirectUrl: parsed.redirect_url }
  }

  async getStatus(providerOrderId: string): Promise<z.infer<typeof transactionStatusSchema>> {
    let response: Response
    try {
      response = await fetch(
        `${apiBaseUrl(this.production)}/v2/${encodeURIComponent(providerOrderId)}/status`,
        {
          headers: {
            accept: 'application/json',
            authorization: authorization(this.serverKey),
          },
          signal: AbortSignal.timeout(5_000),
        },
      )
    } catch (error) {
      throw new DomainError('PAYMENT_PROVIDER_UNAVAILABLE', 'Midtrans status request failed', {
        retryable: true,
        cause: error,
      })
    }
    const body = await responseJson(response)
    if (!response.ok) {
      throw new DomainError('PAYMENT_PROVIDER_UNAVAILABLE', 'Midtrans status request was rejected', {
        retryable: response.status >= 500,
        details: { status: response.status },
      })
    }
    return transactionStatusSchema.parse(body)
  }

  async expirePayment(providerOrderId: string): Promise<void> {
    let response: Response
    try {
      response = await fetch(
        `${apiBaseUrl(this.production)}/v2/${encodeURIComponent(providerOrderId)}/expire`,
        {
          method: 'POST',
          headers: {
            accept: 'application/json',
            authorization: authorization(this.serverKey),
            'content-type': 'application/json',
          },
          signal: AbortSignal.timeout(5_000),
        },
      )
    } catch (error) {
      throw new DomainError('PAYMENT_PROVIDER_UNAVAILABLE', 'Midtrans expiry request failed', {
        retryable: true,
        cause: error,
      })
    }
    if (!response.ok && response.status !== 404) {
      throw new DomainError('PAYMENT_PROVIDER_UNAVAILABLE', 'Midtrans expiry was rejected', {
        retryable: response.status >= 500,
        details: { status: response.status },
      })
    }
  }

  async refundPayment(input: { referenceId: string; refundKey: string; amount: number; reason: string }): Promise<z.infer<typeof refundResponseSchema>> {
    let response: Response
    try {
      response = await fetch(`${apiBaseUrl(this.production)}/v2/${encodeURIComponent(input.referenceId)}/refund`, {
        method: 'POST',
        headers: { accept: 'application/json', authorization: authorization(this.serverKey), 'content-type': 'application/json' },
        body: JSON.stringify({ refund_key: input.refundKey, amount: input.amount, reason: input.reason }),
        signal: AbortSignal.timeout(8_000),
      })
    } catch (error) {
      throw new DomainError('PAYMENT_PROVIDER_UNAVAILABLE', 'Midtrans refund request failed', { retryable: true, cause: error })
    }
    const body = await responseJson(response)
    if (!response.ok) throw new DomainError('PAYMENT_PROVIDER_UNAVAILABLE', 'Midtrans rejected the refund', { retryable: response.status >= 500, details: { status: response.status } })
    return refundResponseSchema.parse(body)
  }
}

export function verifyMidtransSignature(
  notification: Pick<MidtransNotification, 'order_id' | 'status_code' | 'gross_amount' | 'signature_key'>,
  serverKey: string,
): boolean {
  const expected = createHash('sha512')
    .update(
      `${notification.order_id}${notification.status_code}${notification.gross_amount}${serverKey}`,
    )
    .digest()
  const actual = Buffer.from(notification.signature_key, 'hex')
  return actual.length === expected.length && timingSafeEqual(actual, expected)
}

function mappedStatus(input: {
  readonly transaction_status: string
  readonly fraud_status?: string | undefined
}): PaymentStatus {
  return mapMidtransStatus({
    transactionStatus: input.transaction_status,
    ...(input.fraud_status === undefined ? {} : { fraudStatus: input.fraud_status }),
  })
}

export async function resolveMidtransPaymentStatus(input: {
  readonly notification: MidtransNotification
  readonly providerOrderId: string
  readonly expectedAmount: number
  readonly client: MidtransStatusClient
}): Promise<MidtransPaymentResolution> {
  const notificationStatus = mappedStatus(input.notification)
  const ambiguous =
    ['PENDING', 'AUTHORIZED', 'UNKNOWN'].includes(notificationStatus) ||
    (notificationStatus === 'SUCCEEDED' && input.notification.status_code !== '200')

  if (!ambiguous) {
    return {
      paymentStatus: notificationStatus,
      statusCode: input.notification.status_code,
      transactionId: input.notification.transaction_id,
      reconciled: false,
    }
  }

  const current = await input.client.getStatus(input.providerOrderId)
  if (current.order_id !== input.providerOrderId) {
    throw new DomainError('CONFLICT', 'Midtrans status belongs to another order')
  }
  if (Number(current.gross_amount) !== input.expectedAmount) {
    throw new DomainError('CONFLICT', 'Midtrans status amount does not match the order')
  }
  return {
    paymentStatus: mappedStatus(current),
    statusCode: current.status_code,
    transactionId: current.transaction_id ?? input.notification.transaction_id,
    reconciled: true,
  }
}
