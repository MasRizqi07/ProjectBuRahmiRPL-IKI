export interface Concert {
  id: string
  title: string
  artist: string
  venue: string
  city: string
  date: string
  imageUrl: string
  category: 'pop' | 'rock' | 'jazz' | 'electronic' | 'hiphop' | 'indie' | 'other'
  status: 'available' | 'limited' | 'soldout'
  tiers: TicketTier[]
  tags?: string[]
}

export interface TicketTier {
  id: string
  name: string
  price: number
  capacity: number
  sold: number
  perks?: string[]
}
