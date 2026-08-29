'use client'

import { useCallback, useEffect, useState } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { Filter, Search, X } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Slider } from '@/components/ui/slider'
import { formatIDR } from '@/lib/utils/format'
import { cn } from '@/lib/utils'

interface SearchAndFilterProps {
  readonly cities: string[]
  readonly activeFilters: Record<string, string | undefined>
  readonly resultsCount: number
}

const groups = [
  { key: 'category', label: 'Kategori', values: ['pop', 'rock', 'jazz', 'electronic', 'hiphop', 'indie'] },
  { key: 'status', label: 'Status', values: ['available', 'limited', 'soldout'] },
] as const

const labels: Record<string, string> = {
  electronic: 'Elektronik',
  hiphop: 'Hip-hop',
  available: 'Tersedia',
  limited: 'Terbatas',
  soldout: 'Habis',
}

const MIN_PRICE = 0
const MAX_PRICE = 5000000
const PRICE_STEP = 100000

export function SearchAndFilter({ cities, activeFilters, resultsCount }: SearchAndFilterProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [query, setQuery] = useState(searchParams.get('q') || '')

  const initialMinPrice = Number(searchParams.get('minPrice')) || MIN_PRICE
  const initialMaxPrice = Number(searchParams.get('maxPrice')) || MAX_PRICE
  const [priceRange, setPriceRange] = useState<[number, number]>([initialMinPrice, initialMaxPrice])

  const updateFilter = useCallback((key: string, value: string | null) => {
    const params = new URLSearchParams(searchParams.toString())
    if (value && value !== 'all') params.set(key, value)
    else params.delete(key)
    const suffix = params.toString()
    router.push(suffix ? `${pathname}?${suffix}` : pathname)
  }, [pathname, router, searchParams])

  const updatePriceRange = useCallback((values: number[]) => {
    const [min, max] = values
    const params = new URLSearchParams(searchParams.toString())
    if (min !== undefined && min > MIN_PRICE) params.set('minPrice', String(min))
    else params.delete('minPrice')

    if (max !== undefined && max < MAX_PRICE) params.set('maxPrice', String(max))
    else params.delete('maxPrice')

    const suffix = params.toString()
    router.push(suffix ? `${pathname}?${suffix}` : pathname)
  }, [pathname, router, searchParams])

  useEffect(() => {
    const activeQuery = searchParams.get('q') || ''
    if (query === activeQuery) return
    const timer = setTimeout(() => updateFilter('q', query || null), 450)
    return () => clearTimeout(timer)
  }, [query, searchParams, updateFilter])

  const clear = () => {
    setQuery('')
    setPriceRange([MIN_PRICE, MAX_PRICE])
    router.push(pathname)
  }

  const hasFilters = Object.values(activeFilters).some(Boolean) ||
    searchParams.has('minPrice') ||
    searchParams.has('maxPrice')

  const renderChips = (key: string, values: readonly string[]) => values.map((value) => {
    const active = activeFilters[key] === value
    return (
      <button
        key={value}
        type="button"
        aria-pressed={active}
        onClick={() => updateFilter(key, active ? null : value)}
        className={cn(
          'rounded-full border px-3.5 py-2 text-xs font-semibold capitalize transition',
          active
            ? 'border-war-gold bg-war-gold text-primary-foreground'
            : 'border-white/8 bg-white/4 text-muted-foreground hover:border-war-gold/40 hover:text-foreground',
        )}
      >
        {labels[value] ?? value}
        {active && <X className="ml-1 inline size-3" />}
      </button>
    )
  })

  return (
    <section className="glass-panel rounded-2xl p-4 sm:p-6" aria-label="Cari dan filter konser">
      <div className="relative">
        <Search className="absolute left-4 top-1/2 size-5 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Cari artis, venue, atau konser…"
          className="h-13 rounded-xl border-white/10 bg-black/25 pl-12 pr-12 text-base"
          aria-label="Cari konser"
        />
        {query && (
          <button
            type="button"
            onClick={() => setQuery('')}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            aria-label="Bersihkan pencarian"
          >
            <X className="size-4" />
          </button>
        )}
      </div>

      <details className="group mt-4" open>
        <summary className="flex cursor-pointer list-none items-center gap-2 py-2 text-sm font-bold">
          <Filter className="size-4 text-war-gold" /> Filter konser
          <span className="ml-auto text-xs font-normal text-muted-foreground group-open:hidden">Tampilkan</span>
        </summary>
        <div className="mt-3 grid gap-6 border-t border-white/8 pt-5 lg:grid-cols-4">
          <div>
            <p className="mb-3 text-xs font-bold uppercase tracking-wider text-muted-foreground">Kota</p>
            <div className="flex flex-wrap gap-2">{renderChips('city', cities)}</div>
          </div>
          {groups.map((group) => (
            <div key={group.key}>
              <p className="mb-3 text-xs font-bold uppercase tracking-wider text-muted-foreground">{group.label}</p>
              <div className="flex flex-wrap gap-2">{renderChips(group.key, group.values)}</div>
            </div>
          ))}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Rentang Harga</p>
              <span className="font-mono text-xs text-war-gold-bright">
                {formatIDR(priceRange[0])} - {formatIDR(priceRange[1])}
              </span>
            </div>
            <Slider
              min={MIN_PRICE}
              max={MAX_PRICE}
              step={PRICE_STEP}
              value={[priceRange[0], priceRange[1]]}
              onValueChange={(vals: number[]) => {
                if (vals.length >= 2) {
                  setPriceRange([vals[0]!, vals[1]!])
                }
              }}
              onValueCommit={(vals: number[]) => {
                updatePriceRange(vals)
              }}
              className="py-2"
            />
          </div>
        </div>
      </details>

      <div className="mt-5 flex items-center justify-between border-t border-white/8 pt-5">
        <motion.p
          key={resultsCount}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-sm text-muted-foreground"
        >
          <strong className="font-mono text-lg text-foreground">{resultsCount}</strong> konser ditemukan
        </motion.p>
        {hasFilters && (
          <button
            type="button"
            onClick={clear}
            className="text-xs font-bold text-war-gold hover:text-war-gold-bright"
          >
            Bersihkan semua
          </button>
        )}
      </div>
    </section>
  )
}
