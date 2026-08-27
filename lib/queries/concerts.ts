import { createClient } from '@/lib/supabase/server'
import type { ConcertWithTiers, ConcertRow } from '@/lib/types/database'

// Fetch all concerts with their tiers
export async function getConcerts(filters?: {
  city?: string
  category?: string
  status?: string
}): Promise<ConcertWithTiers[]> {
  const supabase = await createClient()

  let query = supabase
    .from('concerts')
    .select(`
      *,
      ticket_tiers (*)
    `)
    .order('date', { ascending: true })

  if (filters?.city) query = query.eq('city', filters.city)
  if (filters?.category) query = query.eq('category', filters.category)
  if (filters?.status) query = query.eq('status', filters.status)

  const { data, error } = await query

  if (error) {
    console.error('[getConcerts]', error.message)
    throw new Error('Gagal memuat data konser')
  }

  return (data as ConcertWithTiers[]) ?? []
}

// Fetch single concert by ID with tiers
export async function getConcertById(id: string): Promise<ConcertWithTiers | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('concerts')
    .select(`
      *,
      ticket_tiers (
        *
      )
    `)
    .eq('id', id)
    .single()

  if (error) {
    if (error.code === 'PGRST116') return null // Not found
    console.error('[getConcertById]', error.message)
    throw new Error('Gagal memuat detail konser')
  }

  return data as ConcertWithTiers
}

// Fetch featured concerts for homepage
export async function getFeaturedConcerts(): Promise<ConcertWithTiers[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('concerts')
    .select('*, ticket_tiers(*)')
    .eq('is_featured', true)
    .order('date', { ascending: true })
    .limit(4)

  if (error) {
    console.error('[getFeaturedConcerts]', error.message)
    return []
  }

  return (data as ConcertWithTiers[]) ?? []
}

// Get unique cities for filter chips
export async function getCities(): Promise<string[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('concerts')
    .select('city')
    .order('city')

  if (error) return []

  const unique = [...new Set(data?.map(d => d.city) ?? [])]
  return unique
}

// Search concerts by query string
export async function searchConcerts(query: string): Promise<ConcertRow[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('concerts')
    .select('*')
    .or(`title.ilike.%${query}%,artist.ilike.%${query}%,city.ilike.%${query}%`)
    .order('date', { ascending: true })
    .limit(20)

  if (error) return []

  return data ?? []
}