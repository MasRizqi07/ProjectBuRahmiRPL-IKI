'use client'

import { useState } from 'react'
import { Search } from 'lucide-react'
import { Input } from '@/components/ui/input'
import type { FilterType } from '@/types'

interface SearchAndFilterProps {
  onSearchChange: (query: string) => void
  onFilterChange: (filter: FilterType) => void
  onCityChange?: (city: string) => void
  activeFilter: FilterType
}

export function SearchAndFilter({
  onSearchChange,
  onFilterChange,
  onCityChange,
  activeFilter,
}: SearchAndFilterProps) {
  const [localSearch, setLocalSearch] = useState('')

  const handleSearchChange = (value: string) => {
    setLocalSearch(value)
    onSearchChange(value)
  }

  const handleFilterClick = (filter: FilterType) => {
    onFilterChange(filter)
  }

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-zinc-500 pointer-events-none" size={20} aria-hidden="true" />
        <Input
          id="concert-search"
          placeholder="Cari artis, venue, atau kota..."
          className="pl-10 bg-zinc-900/50 border-zinc-700/50 text-foreground placeholder:text-zinc-500 rounded-xl focus:border-amber-500/50"
          value={localSearch}
          onChange={(e) => handleSearchChange(e.target.value)}
          aria-label="Cari konser berdasarkan artis, venue, atau kota"
          aria-describedby="search-hint"
        />
        <div id="search-hint" className="sr-only">
          Masukkan nama artis, venue, atau kota untuk mencari konser
        </div>
      </div>

      <div className="flex flex-wrap gap-2" role="group" aria-label="Filter konser">
        {[
          { id: 'all' as FilterType, label: 'Semua' },
          { id: 'this-week' as FilterType, label: 'Minggu Ini' },
          { id: 'this-month' as FilterType, label: 'Bulan Ini' },
          { id: 'by-city' as FilterType, label: 'Berdasarkan Kota' },
        ].map((filter) => (
          <button
            key={filter.id}
            type="button"
            onClick={() => handleFilterClick(filter.id)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
              activeFilter === filter.id
                ? 'bg-amber-400/20 text-amber-400 border border-amber-500/50'
                : 'bg-zinc-900/50 text-zinc-400 border border-zinc-700/50 hover:border-zinc-600/50'
            }`}
            {...(activeFilter === filter.id ? { 'aria-pressed': true } : { 'aria-pressed': false })}
            aria-label={`Filter konser: ${filter.label}`}
          >
            {filter.label}
          </button>
        ))}
      </div>

      {activeFilter === 'by-city' && (
        <div>
          <label htmlFor="city-search" className="sr-only">
            Cari berdasarkan kota
          </label>
          <Input
            id="city-search"
            placeholder="Masukkan nama kota"
            className="bg-zinc-900/50 border-zinc-700/50 text-foreground placeholder:text-zinc-500 rounded-xl focus:border-amber-500/50"
            onChange={(e) => onCityChange?.(e.target.value)}
            aria-label="Cari konser berdasarkan kota"
          />
        </div>
      )}
    </div>
  )
}
