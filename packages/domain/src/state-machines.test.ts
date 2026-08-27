import { describe, expect, it } from 'vitest'
import { assertOrderTransition, assertReservationTransition } from './state-machines'

describe('state machine guards', () => {
  it('accepts supported transitions', () => {
    expect(() => assertReservationTransition('HELD', 'CHECKOUT_PENDING')).not.toThrow()
    expect(() => assertOrderTransition('PENDING_PAYMENT', 'PAID')).not.toThrow()
  })

  it('rejects terminal-state resurrection', () => {
    expect(() => assertReservationTransition('EXPIRED', 'CONFIRMED')).toThrow(
      'reservation cannot transition',
    )
  })
})
