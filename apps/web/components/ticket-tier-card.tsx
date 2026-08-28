'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { ArrowRight, Check, LoaderCircle } from 'lucide-react'
import type { TicketTier } from '@/lib/types/concert'
import { Button } from '@/components/ui/button'
import { InlineAlert } from '@/components/feedback/inline-alert'
import { cn } from '@/lib/utils'
import { formatIDR, getAvailabilityPercent } from '@/lib/utils/format'

export function TicketTierCard({ tier, concertId }: { readonly tier: TicketTier; readonly concertId: string }) {
  const router = useRouter()
  const [openingQueue, setOpeningQueue] = useState(false)
  const [queueError, setQueueError] = useState<string | null>(null)
  const remaining = Math.max(0, tier.capacity - tier.sold)
  const percentage = getAvailabilityPercent(tier)
  const available = remaining > 0

  const enterQueue = (): void => {
    setOpeningQueue(true)
    setQueueError(null)
    try {
      router.push(`/waiting-room?eventId=${concertId}&tierId=${tier.id}`)
    } catch (error) {
      setQueueError(error instanceof Error ? error.message : 'Antrean tidak dapat dibuka')
      setOpeningQueue(false)
    }
  }

  return (
    <article className="interactive-lift glass-panel relative flex h-full flex-col overflow-hidden rounded-2xl p-6">
      <div className="absolute inset-x-0 top-0 h-1 bg-linear-to-r from-transparent via-war-gold to-transparent" />
      <div className="flex items-start justify-between gap-4">
        <div><p className="text-xs font-bold uppercase tracking-wider text-war-gold">Kategori</p><h3 className="mt-2 font-display text-3xl tracking-wide">{tier.name}</h3></div>
        <span className={cn('rounded-full border px-3 py-1 text-[10px] font-bold uppercase tracking-wider', available ? 'border-status-success/25 bg-status-success/8 text-emerald-300' : 'border-destructive/25 bg-destructive/8 text-red-300')}>{available ? 'Tersedia' : 'Habis'}</span>
      </div>
      <p className="mt-5 font-mono text-2xl font-bold text-war-gold">{formatIDR(tier.price)}</p>
      <div className="mt-5">
        <div className="mb-2 flex justify-between text-xs text-muted-foreground"><span>Ketersediaan</span><span>{remaining.toLocaleString('id-ID')} tersisa</span></div>
        <div className="h-1.5 overflow-hidden rounded-full bg-white/6"><motion.div initial={{ width: 0 }} whileInView={{ width: `${percentage}%` }} viewport={{ once: true }} className={cn('h-full rounded-full', percentage > 50 ? 'bg-status-success' : percentage > 20 ? 'bg-war-gold' : 'bg-destructive')} /></div>
      </div>
      <ul className="my-6 flex-1 space-y-3 border-t border-white/8 pt-5">
        {(tier.perks ?? []).map((perk) => <li key={perk} className="flex items-start gap-3 text-sm text-muted-foreground"><Check className="mt-0.5 size-4 shrink-0 text-war-gold" />{perk}</li>)}
      </ul>
      {queueError && <InlineAlert variant="error" className="mb-4">{queueError}</InlineAlert>}
      <Button type="button" onClick={enterQueue} disabled={!available || openingQueue} size="lg" className="h-12 w-full rounded-xl font-bold">
        {openingQueue ? <><LoaderCircle className="animate-spin" /> Membuka antrean…</> : available ? <>Masuk antrean <ArrowRight /></> : 'Terjual habis'}
      </Button>
    </article>
  )
}
