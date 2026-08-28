import { describe, expect, it } from 'vitest'
import { hashIdempotentRequest } from './idempotency'

describe('hashIdempotentRequest', () => {
  it('is stable across object key ordering', () => {
    expect(hashIdempotentRequest({ eventId: 'event', qty: 2 })).toBe(
      hashIdempotentRequest({ qty: 2, eventId: 'event' }),
    )
  })

  it('changes when a business input changes', () => {
    expect(hashIdempotentRequest({ eventId: 'event', qty: 1 })).not.toBe(
      hashIdempotentRequest({ eventId: 'event', qty: 2 }),
    )
  })
})
