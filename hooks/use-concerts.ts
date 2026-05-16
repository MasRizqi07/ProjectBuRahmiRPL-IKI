'use client'

import { useState, useMemo } from 'react'
import { concerts, filterConcerts } from '@/lib/concerts'
import { useDebounce } from './use-debounce'
import type { FilterType } from '@/types'

export function useConcerts() {
  const [searchQuery, setSearchQuery] = useState('')
  const [activeFilter, setActiveFilter] = useState<FilterType>('all')
  const [cityQuery, setCityQuery] = useState('')

  const debouncedSearch = useDebounce(searchQuery, 400)

  const concertsList = useMemo(() => {
    let result = filterConcerts(concerts, activeFilter, cityQuery)

    if (debouncedSearch.trim()) {
      const q = debouncedSearch.toLowerCase()
      result = result.filter(
        (concert) =>
          concert.title.toLowerCase().includes(q) ||
          concert.artist.toLowerCase().includes(q) ||
          concert.venue.toLowerCase().includes(q) ||
          concert.city.toLowerCase().includes(q)
      )
    }

    return result
  }, [debouncedSearch, activeFilter, cityQuery])

  return {
    concerts: concertsList,
    searchQuery,
    setSearchQuery,
    activeFilter,
    setActiveFilter,
    cityQuery,
    setCityQuery,
    isEmpty: concertsList.length === 0,
    total: concertsList.length,
  }
}
