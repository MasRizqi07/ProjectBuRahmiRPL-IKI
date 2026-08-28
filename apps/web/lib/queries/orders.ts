import { createClient } from '@/lib/supabase/server'
import type { OrderWithDetails } from '@/lib/types/database'

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
