import { Concert, TicketTier } from '@/lib/types/concert'

interface CartItem {
  concert: Pick<Concert, 'id' | 'title' | 'artist' | 'date' | 'venue' | 'imageUrl'>
  tier: TicketTier
  quantity: number
}

interface CartStore {
  items: CartItem[]
  addItem: (concert: CartItem['concert'], tier: TicketTier, quantity?: number) => void
  removeItem: (concertId: string, tierId: string) => void
  clearCart: () => void
  getTotalAmount: () => number
  getTotalItems: () => number
}

const errorMessage =
  'Cart persistence is disabled. Install zustand to enable cart storage and state management.'

export const useCartStore = (): CartStore => ({
  items: [],
  addItem: () => {
    throw new Error(errorMessage)
  },
  removeItem: () => {
    throw new Error(errorMessage)
  },
  clearCart: () => {
    throw new Error(errorMessage)
  },
  getTotalAmount: () => 0,
  getTotalItems: () => 0,
})
