'use client'

import { useState, useDeferredValue, useEffect } from 'react'
import { Search, X } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'

interface SearchAndFilterProps {
  onSearchChange: (query: string) => void
  onFilterChange: (type: 'city' | 'category' | 'status', value: string) => void
  onClearFilters: () => void
  activeFilters: {
    city?: string
    category?: string
    status?: string
    [key: string]: string | undefined
  }
  resultsCount: number
}

const CITY_FILTERS = ['Jakarta', 'Surabaya', 'Bandung', 'Bali', 'Medan', 'Yogyakarta']
const CATEGORY_FILTERS = ['pop', 'rock', 'jazz', 'electronic', 'hiphop', 'indie']
const STATUS_FILTERS = ['available', 'limited', 'soldout']

const STATUS_LABELS: Record<string, string> = {
  available: 'Tersedia',
  limited: 'Terbatas',
  soldout: 'Habis'
}

export function SearchAndFilter({
  onSearchChange,
  onFilterChange,
  onClearFilters,
  activeFilters,
  resultsCount,
}: SearchAndFilterProps) {
  const [query, setQuery] = useState('')
  const deferredQuery = useDeferredValue(query)
  const hasActiveFilters = Object.values(activeFilters).some(val => val !== undefined && val !== 'all')

  useEffect(() => {
    onSearchChange(deferredQuery)
  }, [deferredQuery, onSearchChange])

  return (
    <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6 shadow-xl w-full">
      <div className="relative mb-6">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40" size={20} />
        <Input
          placeholder="Cari artis, venue, atau konser..."
          className="w-full bg-white/5 border-white/10 text-white placeholder:text-white/40 pl-12 pr-4 py-6 rounded-xl focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:border-transparent transition-all font-body text-base"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        {query && (
          <button
            onClick={() => setQuery('')}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 hover:text-white transition-colors"
            aria-label="Bersihkan pencarian"
          >
            <X size={18} aria-hidden="true" />
          </button>
        )}
      </div>

      <div className="space-y-6">
        {/* City Filter */}
        <div className="space-y-3">
          <p className="font-body text-sm font-semibold text-white/60 uppercase tracking-wider">Kota</p>
          <div className="flex flex-wrap gap-2">
            {CITY_FILTERS.map((city) => (
              <button
                key={city}
                onClick={() => onFilterChange('city', activeFilters.city === city ? 'all' : city)}
                className={cn(
                  "px-4 py-1.5 rounded-full font-body text-sm transition-all duration-200 border flex items-center gap-1.5",
                  activeFilters.city === city
                    ? "bg-violet-500 border-violet-500 text-white font-medium shadow-[0_0_15px_rgba(139,92,246,0.4)]"
                    : "bg-white/5 border-white/10 text-white/60 hover:border-white/30 hover:text-white/80"
                )}
              >
                {city}
                {activeFilters.city === city && <X size={14} />}
              </button>
            ))}
          </div>
        </div>

        {/* Category Filter */}
        <div className="space-y-3">
          <p className="font-body text-sm font-semibold text-white/60 uppercase tracking-wider">Kategori</p>
          <div className="flex flex-wrap gap-2">
            {CATEGORY_FILTERS.map((cat) => (
              <button
                key={cat}
                onClick={() => onFilterChange('category', activeFilters.category === cat ? 'all' : cat)}
                className={cn(
                  "px-4 py-1.5 rounded-full font-body text-sm transition-all duration-200 border flex items-center gap-1.5 capitalize",
                  activeFilters.category === cat
                    ? "bg-purple-500 border-purple-500 text-white font-medium shadow-[0_0_15px_rgba(168,85,247,0.4)]"
                    : "bg-white/5 border-white/10 text-white/60 hover:border-white/30 hover:text-white/80"
                )}
              >
                {cat}
                {activeFilters.category === cat && <X size={14} />}
              </button>
            ))}
          </div>
        </div>

        {/* Status Filter */}
        <div className="space-y-3">
          <p className="font-body text-sm font-semibold text-white/60 uppercase tracking-wider">Ketersediaan</p>
          <div className="flex flex-wrap gap-2">
            {STATUS_FILTERS.map((status) => (
              <button
                key={status}
                onClick={() => onFilterChange('status', activeFilters.status === status ? 'all' : status)}
                className={cn(
                  "px-4 py-1.5 rounded-full font-body text-sm transition-all duration-200 border flex items-center gap-1.5",
                  activeFilters.status === status
                    ? "bg-fuchsia-500 border-fuchsia-500 text-white font-medium shadow-[0_0_15px_rgba(217,70,239,0.4)]"
                    : "bg-white/5 border-white/10 text-white/60 hover:border-white/30 hover:text-white/80"
                )}
              >
                {STATUS_LABELS[status]}
                {activeFilters.status === status && <X size={14} />}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-8 pt-6 border-t border-white/10 flex items-center justify-between">
        <motion.p 
          key={resultsCount}
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          className="font-body text-white/80"
        >
          Menampilkan <span className="font-mono font-bold text-white text-lg">{resultsCount}</span> konser
        </motion.p>
        
        <AnimatePresence>
          {hasActiveFilters && (
            <motion.button
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              onClick={onClearFilters}
              className="text-sm font-body text-white/50 hover:text-white flex items-center gap-1 transition-colors"
            >
              <X size={16} /> Bersihkan Filter
            </motion.button>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
