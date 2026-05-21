'use client'

import { Navbar } from '@/components/navbar'
import { SearchAndFilter } from '@/components/search-and-filter'
import { ConcertGrid } from '@/components/concert-grid'
import { useConcerts } from '@/hooks/use-concerts'

export default function ConcertsPage() {
  const {
    concerts,
    setSearchQuery,
    activeFilters,
    setFilter,
    clearFilters,
    isEmpty,
    total,
  } = useConcerts()

  return (
    <div className="min-h-screen bg-zinc-950">
      <Navbar />

      <main id="main-content" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <div className="mb-8 animate-fade-up">
          <h1 className="font-display text-4xl sm:text-5xl font-black text-white mb-2">
            Jelajahi Konser
          </h1>
          <p className="text-zinc-400 font-body">
            Temukan dan pesan tiket konser favoritmu dari ribuan pilihan
          </p>
        </div>

        <div className="mb-10 animate-fade-up">
          <SearchAndFilter
            activeFilters={activeFilters as Record<string, string>}
            onSearchChange={setSearchQuery}
            onFilterChange={(type, value) => setFilter(type as any, value)}
            onClearFilters={clearFilters}
            resultsCount={total}
          />
        </div>

        {isEmpty ? (
          <div className="text-center py-16 animate-fade-up">
            <p className="font-body text-zinc-400 text-lg">
              Tidak ada konser yang sesuai dengan pencarian Anda.
            </p>
          </div>
        ) : (
          <ConcertGrid concerts={concerts} />
        )}
      </main>
    </div>
  )
}
