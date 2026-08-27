import { DomainError } from './errors'

export interface PricedItem {
  readonly referenceId: string
  readonly label: string
  readonly unitPrice: number
  readonly quantity: number
}

export interface PriceQuote {
  readonly currency: 'IDR'
  readonly subtotal: number
  readonly serviceFee: number
  readonly total: number
  readonly items: readonly PricedItem[]
}

export function calculatePriceQuote(
  items: readonly PricedItem[],
  serviceFeeBasisPoints: number,
): PriceQuote {
  if (items.length === 0) {
    throw new DomainError('VALIDATION_ERROR', 'At least one item is required')
  }

  if (!Number.isSafeInteger(serviceFeeBasisPoints) || serviceFeeBasisPoints < 0) {
    throw new DomainError('VALIDATION_ERROR', 'Service fee basis points are invalid')
  }

  const subtotal = items.reduce((total, item) => {
    if (
      !Number.isSafeInteger(item.unitPrice) ||
      item.unitPrice < 0 ||
      !Number.isSafeInteger(item.quantity) ||
      item.quantity < 1
    ) {
      throw new DomainError('VALIDATION_ERROR', 'Item price or quantity is invalid')
    }

    const lineTotal = item.unitPrice * item.quantity
    if (!Number.isSafeInteger(lineTotal)) {
      throw new DomainError('VALIDATION_ERROR', 'Line total exceeds safe money range')
    }

    return total + lineTotal
  }, 0)

  const serviceFee = Math.round((subtotal * serviceFeeBasisPoints) / 10_000)
  const total = subtotal + serviceFee

  if (!Number.isSafeInteger(total)) {
    throw new DomainError('VALIDATION_ERROR', 'Order total exceeds safe money range')
  }

  return { currency: 'IDR', subtotal, serviceFee, total, items }
}

export function assertInventoryInvariant(input: {
  capacity: number
  held: number
  sold: number
}): void {
  const { capacity, held, sold } = input
  if (
    ![capacity, held, sold].every(Number.isSafeInteger) ||
    capacity < 0 ||
    held < 0 ||
    sold < 0 ||
    held + sold > capacity
  ) {
    throw new DomainError('CONFLICT', 'Inventory invariant violated', {
      details: input,
    })
  }
}
