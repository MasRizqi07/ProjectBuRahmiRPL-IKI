import { describe, expect, it } from 'vitest'
import { mapMidtransStatus } from './payment'

describe('mapMidtransStatus', () => {
  it('does not accept a capture challenged by fraud detection', () => {
    expect(mapMidtransStatus({ transactionStatus: 'capture', fraudStatus: 'challenge' }))
      .toBe('AUTHORIZED')
    expect(mapMidtransStatus({ transactionStatus: 'capture', fraudStatus: 'deny' }))
      .toBe('DENIED')
  })

  it('requires an accepted fraud result when settlement includes one', () => {
    expect(mapMidtransStatus({ transactionStatus: 'settlement', fraudStatus: 'accept' }))
      .toBe('SUCCEEDED')
    expect(mapMidtransStatus({ transactionStatus: 'settlement', fraudStatus: 'challenge' }))
      .toBe('AUTHORIZED')
  })
})
