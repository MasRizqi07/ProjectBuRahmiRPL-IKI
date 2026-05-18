import type { Concert } from '@/types'
import { formatCurrency, getAvailabilityLabel, getAvailabilityColor } from '@/lib/concerts'
import { ChevronRight } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'

interface ConcertCardProps {
  concert: Concert
  index?: number
}

export function ConcertCard({ concert, index = 0 }: ConcertCardProps) {
  const delayMs = index * 75

  return (
    <Link href={`/concerts/${concert.id}`}>
      <div className="group cursor-pointer h-full flex flex-col rounded-2xl border border-zinc-700/50 hover:border-amber-500 transition-all duration-300 overflow-hidden hover:shadow-xl hover:shadow-amber-500/20 bg-card animate-fade-up">
        <div className="relative h-48 sm:h-56 overflow-hidden bg-zinc-900">
          <Image
            src={concert.image || '/images/placeholder.jpg'}
            alt={`Poster konser ${concert.title}`}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            className="object-cover transition-transform duration-700 group-hover:scale-110"
          />
          {/* Overlay gradient agar badge selalu terbaca */}
          <div className="absolute inset-0 bg-linear-to-t from-zinc-950 via-zinc-950/20 to-transparent opacity-80 group-hover:opacity-60 transition-opacity duration-300" />

          {concert.status === 'limited' && (
            <div
              className="absolute top-3 right-3 rounded-lg bg-red-500 px-3 py-1.5 text-xs font-bold text-white animate-pulse-badge"
              aria-label="Penawaran terbatas"
            >
              SELLING FAST
            </div>
          )}
        </div>

        <div className="flex-1 p-4 sm:p-5 flex flex-col">
          <div className="mb-3">
            <h3 className="text-xl sm:text-2xl font-black text-foreground mb-1 line-clamp-1" aria-label={`Artis: ${concert.artist}`}>
              {concert.artist}
            </h3>
            <p className="text-xs sm:text-sm text-zinc-400 line-clamp-2" aria-label={`Venue: ${concert.venue}`}>
              {concert.venue}
            </p>
          </div>

          <div className="mb-4">
            <p className="text-xs font-mono text-zinc-500" aria-label={`Tanggal: ${concert.date}`}>
              {concert.date} • {concert.time}
            </p>
          </div>

          <div className="mb-4 pb-4 border-b border-zinc-700/50">
            <div className="text-xs text-zinc-500 mb-1">Harga</div>
            <p
              className="text-sm sm:text-base font-semibold text-amber-400"
              aria-label={`Harga: ${formatCurrency(concert.priceMin ?? 0)} hingga ${formatCurrency(concert.priceMax ?? 0)}`}
            >
              {formatCurrency(concert.priceMin ?? 0)} – {formatCurrency(concert.priceMax ?? 0)}
            </p>
          </div>

          <div className="mt-auto flex items-center justify-between">
            <span
              className={`inline-flex items-center px-3 py-1.5 rounded-lg border text-xs font-medium ${getAvailabilityColor(concert.status)}`}
              aria-label={`Status ketersediaan: ${getAvailabilityLabel(concert.status)}`}
            >
              {getAvailabilityLabel(concert.status)}
            </span>
            <div className="text-zinc-400 group-hover:text-amber-400 transition-colors" aria-hidden="true">
              <ChevronRight size={18} />
            </div>
          </div>
        </div>
      </div>
    </Link>
  )
}
