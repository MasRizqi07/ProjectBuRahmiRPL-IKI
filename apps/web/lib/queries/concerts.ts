import { createClient } from '@/lib/supabase/server'
import type { ConcertWithTiers, ConcertRow } from '@/lib/types/database'
import { concerts as demoConcerts } from '@/lib/data/concerts'
import { isSupabaseConfigured } from '@/lib/supabase/config'

function getDemoConcerts(): ConcertWithTiers[] {
  return demoConcerts.map((concert) => ({
    id: concert.id,
    title: concert.title,
    artist: concert.artist,
    venue: concert.venue,
    city: concert.city,
    date: concert.date,
    image_url: concert.imageUrl ?? '/placeholder.svg',
    category: concert.category,
    status: concert.status,
    description: null,
    tags: concert.tags ?? [],
    is_featured: true,
    created_at: concert.date,
    updated_at: concert.date,
    ticket_tiers: (concert.tiers ?? []).map((tier, sortOrder) => ({
      ...tier,
      concert_id: concert.id,
      perks: tier.perks ?? [],
      sort_order: sortOrder,
      created_at: concert.date,
    })),
  }))
}

// Fetch all concerts with their tiers
export async function getConcerts(filters?: {
  city?: string
  category?: ConcertRow['category']
  status?: ConcertRow['status']
  query?: string
}): Promise<ConcertWithTiers[]> {
  if (!isSupabaseConfigured()) {
    const normalizedQuery = filters?.query?.trim().toLocaleLowerCase('id-ID')
    return getDemoConcerts().filter((concert) => {
      const matchesQuery = !normalizedQuery || [concert.title, concert.artist, concert.venue, concert.city]
        .some((value) => value.toLocaleLowerCase('id-ID').includes(normalizedQuery))
      return matchesQuery &&
        (!filters?.city || concert.city === filters.city) &&
        (!filters?.category || concert.category === filters.category) &&
        (!filters?.status || concert.status === filters.status)
    })
  }

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

  const concerts = data ?? []
  const normalizedQuery = filters?.query?.trim().toLocaleLowerCase('id-ID')
  if (!normalizedQuery) return concerts

  return concerts.filter((concert) =>
    [concert.title, concert.artist, concert.venue, concert.city]
      .some((value) => value.toLocaleLowerCase('id-ID').includes(normalizedQuery))
  )
}

// Fetch single concert by ID with tiers
export async function getConcertById(id: string): Promise<ConcertWithTiers | null> {
  if (!isSupabaseConfigured()) {
    return getDemoConcerts().find((concert) => concert.id === id) ?? null
  }

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

  return data
}

// Fetch featured concerts for homepage
export async function getFeaturedConcerts(): Promise<ConcertWithTiers[]> {
  if (!isSupabaseConfigured()) {
    return getDemoConcerts().slice(0, 4)
  }

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

  return (data) ?? []
}

// Get unique cities for filter chips
export async function getCities(): Promise<string[]> {
  if (!isSupabaseConfigured()) {
    return [...new Set(getDemoConcerts().map((concert) => concert.city))].sort()
  }

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
  if (!isSupabaseConfigured()) {
    const normalizedQuery = query.trim().toLocaleLowerCase('id-ID')
    return getDemoConcerts()
      .filter((concert) =>
        [concert.title, concert.artist, concert.city].some((value) =>
          value.toLocaleLowerCase('id-ID').includes(normalizedQuery)
        )
      )
      .slice(0, 20)
  }

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
