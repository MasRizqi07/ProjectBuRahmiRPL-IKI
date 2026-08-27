import { createClient } from '@/lib/supabase/server'
import type { OrderRow, OrderWithDetails } from '@/lib/types/database'

// Get current user's orders
export async function getUserOrders(): Promise<OrderWithDetails[]> {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const { data, error } = await supabase
    .from('orders')
    .select(`
      *,
      concerts (title, artist, date, venue, city, image_url),
      ticket_tiers (name, price)
    `)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('[getUserOrders]', error.message)
    throw new Error('Gagal memuat riwayat tiket')
  }

  return data
}

// Create new order
export async function createOrder(payload: {
  concert_id: string
  tier_id: string
  quantity: number
  total_price: number
}): Promise<OrderRow> {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const { data, error } = await supabase
    .from('orders')
    .insert({ ...payload, user_id: user.id, status: 'pending' })
    .select()
    .single()

  if (error) {
    console.error('[createOrder]', error.message)
    throw new Error('Gagal membuat pesanan')
  }

  return data
}