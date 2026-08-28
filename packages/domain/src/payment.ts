import type { OrderStatus, PaymentStatus } from '@war-ticket/contracts'

export function mapMidtransStatus(input: {
  transactionStatus: string
  fraudStatus?: string
}): PaymentStatus {
  const status = input.transactionStatus.toLowerCase()
  const fraudStatus = input.fraudStatus?.toLowerCase()

  if (status === 'capture') {
    if (fraudStatus === 'accept') return 'SUCCEEDED'
    return fraudStatus === 'deny' ? 'DENIED' : 'AUTHORIZED'
  }

  switch (status) {
    case 'settlement':
      if (fraudStatus === undefined || fraudStatus === 'accept') return 'SUCCEEDED'
      return fraudStatus === 'deny' ? 'DENIED' : 'AUTHORIZED'
    case 'pending':
      return 'PENDING'
    case 'authorize':
      return 'AUTHORIZED'
    case 'deny':
      return 'DENIED'
    case 'expire':
      return 'EXPIRED'
    case 'cancel':
      return 'CANCELLED'
    case 'refund':
    case 'partial_refund':
      return 'REFUNDED'
    default:
      return 'UNKNOWN'
  }
}

export function orderStatusForPayment(
  paymentStatus: PaymentStatus,
  reservationIsActive: boolean,
): OrderStatus | null {
  if (paymentStatus === 'SUCCEEDED') {
    return reservationIsActive ? 'PAID' : 'PAYMENT_REVIEW_REQUIRED'
  }

  if (paymentStatus === 'EXPIRED') return 'EXPIRED'
  if (paymentStatus === 'CANCELLED' || paymentStatus === 'DENIED') return 'CANCELLED'
  if (paymentStatus === 'REFUNDED') return 'REFUNDED'

  return null
}
