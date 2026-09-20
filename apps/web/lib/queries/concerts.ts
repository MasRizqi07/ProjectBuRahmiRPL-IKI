import { createPublicClient } from '@/lib/supabase/server'
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

function filterDemoConcerts(filters?: {
  city?: string
  category?: ConcertRow['category']
  status?: ConcertRow['status']
  query?: string
  minPrice?: number
  maxPrice?: number
}): ConcertWithTiers[] {
  const minPrice = filters?.minPrice
  const maxPrice = filters?.maxPrice

  const matchesPrice = (concert: ConcertWithTiers): boolean => {
    if (minPrice === undefined && maxPrice === undefined) return true
    const lowestTierPrice = Math.min(...(concert.ticket_tiers.map((t) => t.price).length ? concert.ticket_tiers.map((t) => t.price) : [0]))
    if (minPrice !== undefined && lowestTierPrice < minPrice) return false
    if (maxPrice !== undefined && lowestTierPrice > maxPrice) return false
    return true
  }

  const normalizedQuery = filters?.query?.trim().toLocaleLowerCase('id-ID')
  return getDemoConcerts().filter((concert) => {
    const matchesQuery = !normalizedQuery || [concert.title, concert.artist, concert.venue, concert.city]
      .some((value) => value.toLocaleLowerCase('id-ID').includes(normalizedQuery))
    return matchesQuery &&
      (!filters?.city || concert.city === filters.city) &&
      (!filters?.category || concert.category === filters.category) &&
      (!filters?.status || concert.status === filters.status) &&
      matchesPrice(concert)
  })
}

// Fetch all concerts with their tiers
export async function getConcerts(filters?: {
  city?: string
  category?: ConcertRow['category']
  status?: ConcertRow['status']
  query?: string
  minPrice?: number
  maxPrice?: number
}): Promise<ConcertWithTiers[]> {
  if (!isSupabaseConfigured()) {
    return filterDemoConcerts(filters)
  }

  try {
    const supabase = createPublicClient()

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
      console.warn('[getConcerts] Falling back to demo data due to Supabase query error:', error.message)
      return filterDemoConcerts(filters)
    }

    let concerts = (data ?? []) as ConcertWithTiers[]
    if (concerts.length === 0) {
      return filterDemoConcerts(filters)
    }

    const minPrice = filters?.minPrice
    const maxPrice = filters?.maxPrice
    const matchesPrice = (concert: ConcertWithTiers): boolean => {
      if (minPrice === undefined && maxPrice === undefined) return true
      const lowestTierPrice = Math.min(...(concert.ticket_tiers.map((t) => t.price).length ? concert.ticket_tiers.map((t) => t.price) : [0]))
      if (minPrice !== undefined && lowestTierPrice < minPrice) return false
      if (maxPrice !== undefined && lowestTierPrice > maxPrice) return false
      return true
    }

    const normalizedQuery = filters?.query?.trim().toLocaleLowerCase('id-ID')
    if (normalizedQuery) {
      concerts = concerts.filter((concert) =>
        [concert.title, concert.artist, concert.venue, concert.city]
          .some((value) => value.toLocaleLowerCase('id-ID').includes(normalizedQuery))
      )
    }

    return concerts.filter(matchesPrice)
  } catch (err) {
    console.warn('[getConcerts] Exception caught, falling back to demo data:', err)
    return filterDemoConcerts(filters)
  }
}

export interface PlatformStats {
  readonly ticketsSold: number
  readonly activeEvents: number
}

export async function getPlatformStats(): Promise<PlatformStats> {
  const fallbackDemo = {
    ticketsSold: 18450,
    activeEvents: getDemoConcerts().length,
  }

  if (!isSupabaseConfigured()) {
    return fallbackDemo
  }

  try {
    const supabase = createPublicClient()
    const now = new Date().toISOString()

    const [ordersRes, concertsRes] = await Promise.all([
      supabase
        .schema('ticketing')
        .from('orders')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'PAID'),
      supabase
        .from('concerts')
        .select('*', { count: 'exact', head: true })
        .gte('date', now),
    ])

    if (ordersRes.error || concertsRes.error) {
      console.warn(
        '[getPlatformStats] Supabase count query returned error, falling back to demo stats:',
        ordersRes.error?.message || concertsRes.error?.message
      )
      return fallbackDemo
    }

    const activeEvents = concertsRes.count ?? (await getConcerts()).length
    return {
      ticketsSold: ordersRes.count ?? fallbackDemo.ticketsSold,
      activeEvents: activeEvents > 0 ? activeEvents : fallbackDemo.activeEvents,
    }
  } catch (err) {
    console.warn('[getPlatformStats] Exception caught, falling back to demo stats:', err)
    return fallbackDemo
  }
}

// Fetch single concert by ID with tiers
export async function getConcertById(id: string): Promise<ConcertWithTiers | null> {
  if (!isSupabaseConfigured()) {
    return getDemoConcerts().find((concert) => concert.id === id) ?? null
  }

  try {
    const supabase = createPublicClient()

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
      if (error.code === 'PGRST116') {
        return getDemoConcerts().find((concert) => concert.id === id) ?? null
      }
      console.warn('[getConcertById] Falling back to demo data due to Supabase error:', error.message)
      return getDemoConcerts().find((concert) => concert.id === id) ?? null
    }

    return data
  } catch (err) {
    console.warn('[getConcertById] Exception caught, falling back to demo data:', err)
    return getDemoConcerts().find((concert) => concert.id === id) ?? null
  }
}

// Fetch featured concerts for homepage
export async function getFeaturedConcerts(): Promise<ConcertWithTiers[]> {
  if (!isSupabaseConfigured()) {
    return getDemoConcerts().slice(0, 4)
  }

  try {
    const supabase = createPublicClient()

    const { data, error } = await supabase
      .from('concerts')
      .select('*, ticket_tiers(*)')
      .eq('is_featured', true)
      .order('date', { ascending: true })
      .limit(4)

    if (error) {
      console.warn('[getFeaturedConcerts] Falling back to demo data due to Supabase error:', error.message)
      return getDemoConcerts().slice(0, 4)
    }

    if (!data || data.length === 0) {
      return getDemoConcerts().slice(0, 4)
    }

    return data
  } catch (err) {
    console.warn('[getFeaturedConcerts] Exception caught, falling back to demo data:', err)
    return getDemoConcerts().slice(0, 4)
  }
}

// Get unique cities for filter chips
export async function getCities(): Promise<string[]> {
  const demoCities = [...new Set(getDemoConcerts().map((concert) => concert.city))].sort()
  if (!isSupabaseConfigured()) {
    return demoCities
  }

  try {
    const supabase = createPublicClient()

    const { data, error } = await supabase
      .from('concerts')
      .select('city')
      .order('city')

    if (error || !data || data.length === 0) {
      return demoCities
    }

    const unique = [...new Set(data.map(d => d.city))]
    return unique.length > 0 ? unique : demoCities
  } catch {
    return demoCities
  }
}

// Search concerts by query string
export async function searchConcerts(query: string): Promise<ConcertRow[]> {
  const searchDemo = () => {
    const normalizedQuery = query.trim().toLocaleLowerCase('id-ID')
    return getDemoConcerts()
      .filter((concert) =>
        [concert.title, concert.artist, concert.city].some((value) =>
          value.toLocaleLowerCase('id-ID').includes(normalizedQuery)
        )
      )
      .slice(0, 20)
  }

  if (!isSupabaseConfigured()) {
    return searchDemo()
  }

  try {
    const supabase = createPublicClient()

    const { data, error } = await supabase
      .from('concerts')
      .select('*')
      .or(`title.ilike.%${query}%,artist.ilike.%${query}%,city.ilike.%${query}%`)
      .order('date', { ascending: true })
      .limit(20)

    if (error || !data || data.length === 0) {
      return searchDemo()
    }

    return data
  } catch {
    return searchDemo()
  }
}
