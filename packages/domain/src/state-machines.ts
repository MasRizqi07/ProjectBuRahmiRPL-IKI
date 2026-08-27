import type {
  OrderStatus,
  PaymentStatus,
  ReservationStatus,
} from '@war-ticket/contracts'
import { DomainError } from './errors'

const reservationTransitions: Readonly<
  Record<ReservationStatus, readonly ReservationStatus[]>
> = {
  HELD: ['CHECKOUT_PENDING', 'EXPIRED', 'RELEASED'],
  CHECKOUT_PENDING: ['CONFIRMED', 'EXPIRED', 'RELEASED'],
  CONFIRMED: [],
  EXPIRED: [],
  RELEASED: [],
}

const orderTransitions: Readonly<Record<OrderStatus, readonly OrderStatus[]>> = {
  PENDING_PAYMENT: [
    'PAID',
    'CANCELLED',
    'EXPIRED',
    'PAYMENT_REVIEW_REQUIRED',
  ],
  PAID: ['REFUNDED'],
  CANCELLED: ['PAYMENT_REVIEW_REQUIRED'],
  EXPIRED: ['PAYMENT_REVIEW_REQUIRED'],
  PAYMENT_REVIEW_REQUIRED: ['PAID', 'REFUNDED'],
  REFUNDED: [],
}

const paymentTransitions: Readonly<
  Record<PaymentStatus, readonly PaymentStatus[]>
> = {
  INITIATING: ['PENDING', 'SUCCEEDED', 'DENIED', 'EXPIRED', 'UNKNOWN'],
  PENDING: ['AUTHORIZED', 'SUCCEEDED', 'DENIED', 'EXPIRED', 'CANCELLED', 'UNKNOWN'],
  AUTHORIZED: ['SUCCEEDED', 'CANCELLED', 'UNKNOWN'],
  SUCCEEDED: ['REFUNDED'],
  DENIED: [],
  EXPIRED: [],
  CANCELLED: [],
  REFUNDED: [],
  UNKNOWN: ['PENDING', 'AUTHORIZED', 'SUCCEEDED', 'DENIED', 'EXPIRED', 'CANCELLED'],
}

function assertTransition<T extends string>(
  aggregate: string,
  transitions: Readonly<Record<T, readonly T[]>>,
  from: T,
  to: T,
): void {
  if (!transitions[from].includes(to)) {
    throw new DomainError(
      'INVALID_STATE_TRANSITION',
      `${aggregate} cannot transition from ${from} to ${to}`,
      { details: { aggregate, from, to } },
    )
  }
}

export function assertReservationTransition(
  from: ReservationStatus,
  to: ReservationStatus,
): void {
  assertTransition('reservation', reservationTransitions, from, to)
}

export function assertOrderTransition(from: OrderStatus, to: OrderStatus): void {
  assertTransition('order', orderTransitions, from, to)
}

export function assertPaymentTransition(
  from: PaymentStatus,
  to: PaymentStatus,
): void {
  assertTransition('payment', paymentTransitions, from, to)
}
