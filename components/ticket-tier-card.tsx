'use client'

import { Button } from '@/components/ui/button'
import type { TicketTier } from '@/types'
import { formatCurrency } from '@/lib/concerts'
import Link from 'next/link'

interface TicketTierCardProps {
  tier: TicketTier
  concertId: string
}

export function TicketTierCard({ tier, concertId }: TicketTierCardProps) {
  const isAvailable = tier.available > 0

  return (
    <div className="group relative border border-zinc-700/50 rounded-2xl p-6 bg-zinc-900/50 hover:bg-zinc-900 hover:border-amber-400/50 hover:shadow-[0_8px_30px_rgba(251,191,36,0.1)] transition-all duration-300 hover:-translate-y-1 flex flex-col h-full">
      <div className="mb-4">
        <h3 className="text-lg font-bold text-foreground mb-2">{tier.name}</h3>
        <div className="flex items-baseline justify-between">
          <span className="text-3xl font-black text-amber-400">{formatCurrency(tier.price)}</span>
          <span className="text-sm text-muted-foreground">
            {tier.available} dari {tier.total} tersedia
          </span>
        </div>
      </div>

      <div className="mb-6 pb-6 border-b border-zinc-700/50">
        <div className="flex items-center gap-2">
          <div
            className={`h-2 w-2 rounded-full ${
              isAvailable ? 'bg-emerald-500' : 'bg-red-500'
            }`}
          />
          <span className={`text-sm ${isAvailable ? 'text-emerald-400' : 'text-red-400'}`}>
            {isAvailable ? 'Tersedia' : 'Habis'}
          </span>
        </div>
      </div>

      <div className="mt-auto pt-4">
        <Link
          href={
            isAvailable
              ? `/waiting-room?concert=${concertId}&tier=${tier.id}&category=${encodeURIComponent(tier.name)}&price=${tier.price}`
              : '#'
          }
          className={!isAvailable ? 'pointer-events-none' : ''}
        >
          <Button
            className={`w-full py-6 text-base font-bold transition-all duration-300 ${isAvailable ? 'bg-amber-400 hover:bg-amber-500 text-zinc-950 group-hover:scale-[1.02]' : 'bg-zinc-800 text-zinc-500 cursor-not-allowed'}`}
            disabled={!isAvailable}
          >
            {isAvailable ? 'Pilih Tiket' : 'Terjual Habis'}
          </Button>
        </Link>
      </div>
    </div>
  )
}
