'use client'

import Image from 'next/image'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { ArrowUpRight, CalendarDays, MapPin } from 'lucide-react'
import type { Concert } from '@/lib/types/concert'
import { formatIDR } from '@/lib/utils/format'
import { cn } from '@/lib/utils'

const statusLabel = { available: 'Tersedia', limited: 'Terbatas', soldout: 'Habis' } as const

export function ConcertCard({ concert, index = 0 }: { readonly concert: Concert; readonly index?: number }) {
  const tiers = concert.ticket_tiers || concert.tiers || []
  const minPrice = tiers.length ? Math.min(...tiers.map((tier) => tier.price)) : 0
  return (
    <motion.article initial={{ opacity: 0, y: 18 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '-40px' }} transition={{ duration: 0.45, delay: Math.min(index * 0.06, 0.18) }} className="interactive-lift group h-full overflow-hidden rounded-2xl border border-white/8 bg-surface">
      <Link href={`/concerts/${concert.id}`} aria-label={`Lihat ${concert.title} oleh ${concert.artist}`} className="flex h-full flex-col">
        <div className="relative aspect-[4/3] overflow-hidden">
          <Image src={concert.image_url || concert.imageUrl || '/placeholder.jpg'} alt={`Poster ${concert.artist} — ${concert.title}`} fill sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw" className={cn('object-cover transition duration-700 group-hover:scale-105', concert.status === 'soldout' && 'grayscale')} priority={index < 3} />
          <div className="card-gradient-overlay absolute inset-0" />
          <div className="absolute inset-x-4 top-4 flex items-start justify-between gap-2">
            <span className="rounded-full border border-white/15 bg-black/45 px-3 py-1 text-[10px] font-bold uppercase tracking-wider backdrop-blur-md">{concert.category}</span>
            <span className={cn('rounded-full border px-3 py-1 text-[10px] font-bold uppercase tracking-wider backdrop-blur-md', concert.status === 'available' ? 'border-status-success/35 bg-status-success/12 text-emerald-300' : concert.status === 'limited' ? 'border-war-gold/35 bg-war-gold/12 text-war-gold-bright' : 'border-destructive/35 bg-destructive/12 text-red-300')}>{statusLabel[concert.status]}</span>
          </div>
        </div>
        <div className="flex flex-1 flex-col p-5">
          <p className="text-xs font-bold uppercase tracking-wider text-war-gold">{concert.artist}</p>
          <h3 className="mt-2 font-display text-3xl leading-none tracking-wide">{concert.title}</h3>
          <div className="mt-4 space-y-2 text-xs text-muted-foreground">
            <p className="flex items-center gap-2"><CalendarDays className="size-4 text-war-gold" />{new Date(concert.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
            <p className="flex items-center gap-2"><MapPin className="size-4 text-war-gold" />{concert.venue}, {concert.city}</p>
          </div>
          <div className="mt-6 flex items-end justify-between gap-4 border-t border-white/8 pt-4">
            <div><p className="text-[10px] uppercase tracking-wider text-muted-foreground">Mulai dari</p><p className="mt-1 font-mono text-sm font-bold text-war-gold sm:text-base">{formatIDR(minPrice)}</p></div>
            <span className="grid size-10 place-items-center rounded-full border border-war-gold/30 text-war-gold transition group-hover:bg-war-gold group-hover:text-primary-foreground"><ArrowUpRight className="size-4" /></span>
          </div>
        </div>
      </Link>
    </motion.article>
  )
}
