export type Database = {
  public: {
    Tables: {
      concerts: {
        Row: {
          id: string
          title: string
          artist: string
          venue: string
          city: string
          date: string
          image_url: string | null
          category: 'pop' | 'rock' | 'jazz' | 'electronic' | 'hiphop' | 'indie' | 'other'
          status: 'available' | 'limited' | 'soldout'
          description: string | null
          tags: string[]
          is_featured: boolean
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['concerts']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['concerts']['Insert']>
        Relationships: []
      }
      ticket_tiers: {
        Row: {
          id: string
          concert_id: string
          name: string
          price: number
          capacity: number
          sold: number
          perks: string[]
          sort_order: number
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['ticket_tiers']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['ticket_tiers']['Insert']>
        Relationships: [
          {
            foreignKeyName: 'ticket_tiers_concert_id_fkey'
            columns: ['concert_id']
            isOneToOne: false
            referencedRelation: 'concerts'
            referencedColumns: ['id']
          },
        ]
      }
      profiles: {
        Row: {
          id: string
          full_name: string | null
          phone: string | null
          avatar_url: string | null
          role: 'user' | 'admin'
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['profiles']['Row'], 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['profiles']['Insert']>
        Relationships: []
      }
      orders: {
        Row: {
          id: string
          user_id: string
          concert_id: string
          tier_id: string
          quantity: number
          total_price: number
          status: 'pending' | 'paid' | 'cancelled' | 'refunded'
          payment_token: string | null
          payment_url: string | null
          ticket_code: string
          created_at: string
          updated_at: string
        }
        Insert: Omit<
          Database['public']['Tables']['orders']['Row'],
          'id' | 'ticket_code' | 'created_at' | 'updated_at' | 'quantity' | 'status' | 'payment_token' | 'payment_url'
        > & Partial<
          Pick<
            Database['public']['Tables']['orders']['Row'],
            'quantity' | 'status' | 'payment_token' | 'payment_url'
          >
        >
        Update: Partial<Database['public']['Tables']['orders']['Insert']>
        Relationships: [
          {
            foreignKeyName: 'orders_concert_id_fkey'
            columns: ['concert_id']
            isOneToOne: false
            referencedRelation: 'concerts'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'orders_tier_id_fkey'
            columns: ['tier_id']
            isOneToOne: false
            referencedRelation: 'ticket_tiers'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'orders_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
        ]
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}

// Convenient aliases
export type ConcertRow = Database['public']['Tables']['concerts']['Row']
export type TierRow = Database['public']['Tables']['ticket_tiers']['Row']
export type ProfileRow = Database['public']['Tables']['profiles']['Row']
export type OrderRow = Database['public']['Tables']['orders']['Row']

// Concert with tiers joined (used in most queries)
export type ConcertWithTiers = ConcertRow & {
  ticket_tiers: TierRow[]
}

// Order with joined concert and tier details
export type OrderWithDetails = OrderRow & {
  concerts: Pick<ConcertRow, 'title' | 'artist' | 'date' | 'venue' | 'city' | 'image_url'> | null
  ticket_tiers: Pick<TierRow, 'name' | 'price'> | null
}
