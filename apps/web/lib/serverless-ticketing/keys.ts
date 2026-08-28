function namespace(eventId: string): string {
  return `wt-edge:{${eventId}}`
}

export function edgeKeys(eventId: string) {
  const prefix = namespace(eventId)
  return {
    prefix,
    inventory: `${prefix}:inventory`,
    tierInventory(tierId: string): string {
      return `${prefix}:inventory-tier:${tierId}`
    },
    tierQuote(tierId: string): string {
      return `${prefix}:tier-quote:${tierId}`
    },
    initializationLock(resource: string): string {
      return `${prefix}:init-lock:${resource}`
    },
    queue: `${prefix}:queue`,
    queueSequence: `${prefix}:queue-sequence`,
    states: `${prefix}:states`,
    released: `${prefix}:released`,
    admissionExpiries: `${prefix}:admission-expiries`,
    holdExpiries: `${prefix}:hold-expiries`,
    expiredOrders: `${prefix}:expired-orders`,
    admission(userId: string): string {
      return `${prefix}:admitted-user:${userId}`
    },
    hold(userId: string): string {
      return `${prefix}:hold:${userId}`
    },
    idempotency(key: string): string {
      return `${prefix}:idem:${key}`
    },
  }
}

export const activeEventsKey = 'wt-edge:active-events'
export const activeEventsCursorKey = 'wt-edge:active-events-sweep-cursor'
