export interface TicketTier {
  id: string
  name: string
  price: number
  available: number
  total: number
  perks: string[]
}

export interface Concert {
  id: string
  title: string
  artist: string
  venue: string
  city: string
  date: string
  time: string
  image: string
  genre: string
  description: string
  ticketTiers: TicketTier[]
  isFeatured?: boolean
  status: 'available' | 'limited' | 'soldout' | 'cancelled'
  imageGradient?: string
  priceMin?: number
  priceMax?: number
  ticketsSold?: number
  totalTickets?: number
}

export type FilterType =
  | 'all'
  | 'this-week'
  | 'this-month'
  | 'by-city'
  | 'available'
  | 'featured'

export interface OrderItem {
  concertId: string
  tierId: string
  quantity: number
  unitPrice: number
}

export interface Order {
  id: string
  userId: string
  items: OrderItem[]
  totalAmount: number
  status: 'pending' | 'paid' | 'cancelled' | 'refunded'
  createdAt: string
}

export interface User {
  id: string
  name: string
  email: string
  role: 'user' | 'admin'
}
