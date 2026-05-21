'use client'

import { useState, useMemo } from 'react'
import { concerts } from '@/lib/data/concerts'
import { filterConcerts, searchConcerts, FilterParams } from '@/lib/utils/filter'

export function useConcerts() {
  const [searchQuery, setSearchQuery] = useState('')
  const [activeFilters, setActiveFilters] = useState<FilterParams>({})

  const setFilter = (type: keyof FilterParams, value: string) => {
    setActiveFilters((prev) => ({
      ...prev,
      [type]: value,
    }))
  }

  const clearFilters = () => {
    setActiveFilters({})
  }

  const concertsList = useMemo(() => {
    // apply filters
    let result = filterConcerts(concerts, activeFilters)

    // apply search query
    if (searchQuery.trim()) {
      result = searchConcerts(result, searchQuery)
    }

    return result
  }, [searchQuery, activeFilters])

  return {
    concerts: concertsList,
    searchQuery,
    setSearchQuery,
    activeFilters,
    setFilter,
    clearFilters,
    isEmpty: concertsList.length === 0,
    total: concertsList.length,
  }
}
