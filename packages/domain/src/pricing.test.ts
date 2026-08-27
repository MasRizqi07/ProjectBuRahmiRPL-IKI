import { describe, expect, it } from 'vitest'
import fc from 'fast-check'
import { assertInventoryInvariant, calculatePriceQuote } from './pricing'

describe('calculatePriceQuote', () => {
  it('calculates an integer IDR fee from server prices', () => {
    expect(
      calculatePriceQuote(
        [{ referenceId: 'vip', label: 'VIP', unitPrice: 1_500_000, quantity: 2 }],
        250,
      ),
    ).toMatchObject({ subtotal: 3_000_000, serviceFee: 75_000, total: 3_075_000 })
  })
})

describe('assertInventoryInvariant', () => {
  it('rejects oversold inventory', () => {
    expect(() => assertInventoryInvariant({ capacity: 10, held: 4, sold: 7 })).toThrow(
      'Inventory invariant violated',
    )
  })

  it('accepts every non-negative state that cannot oversell', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 1_000_000 }),
        fc.integer({ min: 0, max: 1_000_000 }),
        fc.integer({ min: 0, max: 1_000_000 }),
        (available, held, sold) => {
          expect(() =>
            assertInventoryInvariant({ capacity: available + held + sold, held, sold }),
          ).not.toThrow()
        },
      ),
    )
  })

  it('rejects every state where held plus sold exceeds capacity', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 1_000_000 }),
        fc.integer({ min: 0, max: 1_000_000 }),
        fc.integer({ min: 1, max: 1_000_000 }),
        (capacity, held, overflow) => {
          const sold = Math.max(0, capacity - held) + overflow
          expect(() => assertInventoryInvariant({ capacity, held, sold })).toThrow()
        },
      ),
    )
  })
})
