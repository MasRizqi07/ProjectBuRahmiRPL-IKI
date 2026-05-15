'use client'

import { useState, useMemo } from 'react'
import { Navbar } from '@/components/navbar'
import { SearchAndFilter } from '@/components/search-and-filter'
import { ConcertGrid } from '@/components/concert-grid'
import { concerts, filterConcerts } from '@/lib/concerts'
import type { FilterType } from '@/types'

export default function ConcertsPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [activeFilter, setActiveFilter] = useState<FilterType>('all')
  const [cityQuery, setCityQuery] = useState('')

  const filteredConcerts = useMemo(() => {
    let result = filterConcerts(concerts, activeFilter, cityQuery)

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      result = result.filter(
        (concert) =>
          concert.title.toLowerCase().includes(query) ||
          concert.artist.toLowerCase().includes(query) ||
          concert.venue.toLowerCase().includes(query) ||
          concert.city.toLowerCase().includes(query)
      )
    }

    return result
  }, [searchQuery, activeFilter, cityQuery])

  return (
    <div className="min-h-screen bg-zinc-950">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <div className="mb-8 animate-fade-up">
          <h1 className="text-4xl sm:text-5xl font-black text-foreground mb-2">
            Jelajahi Konser
          </h1>
          <p className="text-zinc-400">
            Temukan dan pesan tiket konser favoritmu dari ribuan pilihan
          </p>
        </div>

        <div className="mb-10 animate-fade-up">
          <SearchAndFilter
            activeFilter={activeFilter}
            onSearchChange={setSearchQuery}
            onFilterChange={setActiveFilter}
            onCityChange={setCityQuery}
          />
        </div>

        {filteredConcerts.length > 0 ? (
          <ConcertGrid concerts={filteredConcerts} />
        ) : (
          <div className="text-center py-16 animate-fade-up">
            <p className="text-zinc-400 text-lg">
              Tidak ada konser yang sesuai dengan pencarian Anda.
            </p>
          </div>
        )}
      </main>
    </div>
  )
}
