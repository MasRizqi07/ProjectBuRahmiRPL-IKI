import { Concert } from '../types/concert'

export interface FilterParams {
  city?: string
  category?: string
  status?: 'available' | 'limited' | 'soldout' | 'all'
  dateRange?: 'this-week' | 'this-month' | 'upcoming' | 'all'
}

export type SortOption = 'date-asc' | 'date-desc' | 'price-asc' | 'price-desc' | 'popularity'

export function filterConcerts(concerts: Concert[], filters: FilterParams): Concert[] {
  return concerts.filter(concert => {
    if (filters.city && filters.city !== 'all' && concert.city.toLowerCase() !== filters.city.toLowerCase()) return false;
    if (filters.category && filters.category !== 'all' && concert.category !== filters.category) return false;
    if (filters.status && filters.status !== 'all' && concert.status !== filters.status) return false;
    
    if (filters.dateRange && filters.dateRange !== 'all') {
      const now = new Date()
      const concertDate = new Date(concert.date)
      
      if (filters.dateRange === 'upcoming' && concertDate < now) return false;
      
      if (filters.dateRange === 'this-week') {
        const nextWeek = new Date()
        nextWeek.setDate(now.getDate() + 7)
        if (concertDate < now || concertDate > nextWeek) return false;
      }
      
      if (filters.dateRange === 'this-month') {
        if (concertDate.getMonth() !== now.getMonth() || concertDate.getFullYear() !== now.getFullYear()) return false;
      }
    }
    
    return true;
  });
}

export function searchConcerts(concerts: Concert[], query: string): Concert[] {
  if (!query) return concerts;
  const lowerQuery = query.toLowerCase();
  return concerts.filter(c => 
    c.title.toLowerCase().includes(lowerQuery) || 
    c.artist.toLowerCase().includes(lowerQuery) ||
    c.venue.toLowerCase().includes(lowerQuery)
  );
}

export function sortConcerts(concerts: Concert[], sortBy: SortOption): Concert[] {
  return [...concerts].sort((a, b) => {
    switch (sortBy) {
      case 'date-asc': 
        return new Date(a.date).getTime() - new Date(b.date).getTime()
      case 'date-desc': 
        return new Date(b.date).getTime() - new Date(a.date).getTime()
      case 'price-asc': {
        const minA = Math.min(...(a.tiers.length ? a.tiers.map(t => t.price) : [0]))
        const minB = Math.min(...(b.tiers.length ? b.tiers.map(t => t.price) : [0]))
        return minA - minB
      }
      case 'price-desc': {
        const minA = Math.min(...(a.tiers.length ? a.tiers.map(t => t.price) : [0]))
        const minB = Math.min(...(b.tiers.length ? b.tiers.map(t => t.price) : [0]))
        return minB - minA
      }
      case 'popularity':
        // Assuming sold-out or limited means more popular
        const statusScore = { 'soldout': 3, 'limited': 2, 'available': 1 }
        return (statusScore[b.status] || 0) - (statusScore[a.status] || 0)
      default:
        return 0
    }
  });
}
