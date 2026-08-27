'use client'

import { Concert } from '@/lib/types/concert'
import { formatIDR } from '@/lib/utils/format'
import Link from 'next/link'
import Image from 'next/image'
import { motion } from 'framer-motion'

interface ConcertCardProps {
  concert: Concert
  index?: number
}

function getAvailabilityBadge(status: Concert['status']) {
  switch (status) {
    case 'available':
      return (
        <span className="bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 backdrop-blur-md px-3 py-1 rounded-full text-xs font-semibold">
          Tersedia
        </span>
      )
    case 'limited':
      return (
        <span className="bg-amber-500/20 border border-amber-500/40 text-amber-400 backdrop-blur-md px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500" />
          </span>
          Terbatas
        </span>
      )
    case 'soldout':
      return (
        <span className="bg-red-500/20 border border-red-500/40 text-red-400 backdrop-blur-md px-3 py-1 rounded-full text-xs font-semibold">
          Habis
        </span>
      )
  }
}

export function ConcertCard({ concert, index = 0 }: ConcertCardProps) {
  const tiers = concert.ticket_tiers || concert.tiers || []
  const minPrice = tiers.length ? Math.min(...tiers.map((t) => t.price)) : 0

  return (
    <motion.div
      whileHover={{
        scale: 1.03,
        rotateX: 2,
        rotateY: -2,
      }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      style={{ transformStyle: 'preserve-3d', perspective: '1000px' }}
      className="h-full"
    >
      <Link
        href={`/concerts/${concert.id}`}
        aria-label={`Lihat detail konser ${concert.title} oleh ${concert.artist}`}
        className="block h-full"
      >
        <div className="relative flex flex-col rounded-xl border border-white/5 overflow-hidden bg-neutral-900 aspect-[3/4] sm:aspect-[4/3] w-full">
          {/* Background Image */}
          <div className="absolute inset-0">
            <Image
              src={concert.image_url || concert.imageUrl || '/images/placeholder.jpg'}
              alt={`Poster konser ${concert.artist} - ${concert.title}`}
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              className={`object-cover transition-transform duration-700 ${concert.status === 'soldout' ? 'grayscale opacity-70' : ''}`}
              priority={index < 3}
            />
          </div>

          {/* Gradient Overlay */}
          <div
            className="absolute inset-0 z-10"
            style={{
              background: 'linear-gradient(to top, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0.4) 50%, transparent 100%)',
            }}
          />

          {/* Top Badges */}
          <div className="absolute top-4 inset-x-4 flex justify-between items-start z-20">
            <span className="bg-white/10 border border-white/20 backdrop-blur-md text-white/90 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider">
              {concert.category}
            </span>
            {getAvailabilityBadge(concert.status)}
          </div>

          {/* Bottom Content */}
          <div className="absolute bottom-0 inset-x-0 p-5 z-20 flex flex-col">
            <h3 className="font-display text-2xl sm:text-3xl font-bold text-white mb-2 leading-tight">
              {concert.artist}
            </h3>
            <p className="font-body text-sm text-white/70 mb-3">
              {new Date(concert.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })} • {concert.venue}
            </p>
            <div className="flex items-center justify-between mt-auto pt-4 border-t border-white/10">
              <span className="font-body text-xs text-white/50">Mulai dari</span>
              <span className="font-mono text-lg sm:text-xl font-bold text-brand-400">
                {formatIDR(minPrice)}
              </span>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  )
}
