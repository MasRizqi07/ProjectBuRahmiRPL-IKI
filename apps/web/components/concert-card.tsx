'use client'

import Image from 'next/image'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { ArrowUpRight, CalendarDays, MapPin, Zap } from 'lucide-react'
import { DemandMeter, type DemandLevel } from '@/components/ui/demand-meter'
import { designAssetByPath } from '@/lib/assets/design-assets'
import type { Concert } from '@/lib/types/concert'
import { formatIDR } from '@/lib/utils/format'
import { cn } from '@/lib/utils'

const statusConfig = {
  available: { label: 'Tersedia', badgeBg: 'border-status-success/35 bg-status-success/12 text-emerald-300', demand: 'low' as DemandLevel },
  limited: { label: 'WAR ACTIVE 🔥', badgeBg: 'border-orange-500/40 bg-orange-500/15 text-orange-400', demand: 'high' as DemandLevel },
  soldout: { label: 'Habis Terjual', badgeBg: 'border-destructive/35 bg-destructive/12 text-red-300', demand: 'extreme' as DemandLevel },
} as const

export function ConcertCard({ concert, index = 0 }: { readonly concert: Concert; readonly index?: number }) {
  const tiers = concert.ticket_tiers || concert.tiers || []
  const minPrice = tiers.length ? Math.min(...tiers.map((tier) => tier.price)) : 0
  const statusInfo = statusConfig[concert.status] || statusConfig.available
  const imageUrl = concert.image_url || concert.imageUrl || '/placeholder.svg'
  const designAsset = designAssetByPath[imageUrl]

  return (
    <motion.article
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.45, delay: Math.min(index * 0.06, 0.18) }}
      className="interactive-lift group h-full overflow-hidden rounded-2xl border border-white/8 bg-[#141413]/90 hover:border-war-gold/50 transition-all duration-300 shadow-[0_10px_30px_rgba(0,0,0,0.4)] hover:shadow-[0_15px_35px_rgba(240,180,41,0.15)] flex flex-col"
    >
      <Link href={`/concerts/${concert.id}`} aria-label={`Lihat ${concert.title} oleh ${concert.artist}`} className="flex h-full flex-col">
        {/* Poster Image */}
        <div className="relative aspect-[16/10] overflow-hidden bg-black/40">
          <Image
            src={imageUrl}
            alt={`Poster ${concert.artist} — ${concert.title}`}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className={cn('object-cover transition duration-700 group-hover:scale-105', concert.status === 'soldout' && 'grayscale')}
            priority={index < 3}
            {...(designAsset ? { placeholder: 'blur' as const, blurDataURL: designAsset.blurDataUrl } : {})}
          />
          <div className="card-gradient-overlay absolute inset-0" />
          
          {/* Top badges */}
          <div className="absolute inset-x-4 top-4 flex items-start justify-between gap-2 z-10">
            <span className="rounded-full border border-white/15 bg-black/60 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-white backdrop-blur-md">
              {concert.category}
            </span>
            <span className={cn('rounded-full border px-3 py-1 text-[10px] font-bold uppercase tracking-wider backdrop-blur-md', statusInfo.badgeBg)}>
              {statusInfo.label}
            </span>
          </div>

          {/* Quick War Pill */}
          {concert.status === 'limited' && (
            <div className="absolute bottom-3 left-4 z-10 flex items-center gap-1 rounded-full bg-orange-500/90 px-2.5 py-0.5 text-[10px] font-black text-black">
              <Zap className="size-3 fill-black" /> WAR ROOM LIVE
            </div>
          )}
        </div>

        {/* Card Body */}
        <div className="flex flex-1 flex-col p-5 justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-widest text-war-gold">{concert.artist}</p>
            <h3 className="mt-1.5 font-display text-2xl sm:text-3xl leading-tight tracking-wide text-foreground group-hover:text-war-gold transition-colors">
              {concert.title}
            </h3>

            <div className="mt-4 space-y-1.5 text-xs text-muted-foreground">
              <p className="flex items-center gap-2">
                <CalendarDays className="size-3.5 text-war-gold" />
                {new Date(concert.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
              </p>
              <p className="flex items-center gap-2">
                <MapPin className="size-3.5 text-war-gold" />
                {concert.venue}, {concert.city}
              </p>
            </div>
          </div>

          <div className="mt-5 pt-4 border-t border-white/8 space-y-3">
            {/* Demand Meter */}
            <DemandMeter level={statusInfo.demand} compact={false} />

            <div className="flex items-end justify-between gap-4 pt-1">
              <div>
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Mulai dari</p>
                <p className="mt-0.5 font-mono text-sm sm:text-base font-bold text-war-gold-bright">
                  {formatIDR(minPrice)}
                </p>
              </div>
              <span className="grid size-9 place-items-center rounded-xl border border-war-gold/30 bg-war-gold/10 text-war-gold transition group-hover:bg-war-gold group-hover:text-black shadow-[0_0_10px_rgba(240,180,41,0.15)]">
                <ArrowUpRight className="size-4" />
              </span>
            </div>
          </div>
        </div>
      </Link>
    </motion.article>
  )
}
