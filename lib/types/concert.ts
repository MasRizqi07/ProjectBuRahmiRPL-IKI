export interface Concert {
  id: string
  title: string
  artist: string
  venue: string
  city: string
  date: string
  imageUrl?: string
  image_url?: string | null
  category: 'pop' | 'rock' | 'jazz' | 'electronic' | 'hiphop' | 'indie' | 'other'
  status: 'available' | 'limited' | 'soldout'
  tiers?: TicketTier[]
  ticket_tiers?: TicketTier[]
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
