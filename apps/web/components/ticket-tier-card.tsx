'use client'

import { Button } from '@/components/ui/button'
import type { TicketTier } from '@/lib/types/concert'
import { formatIDR } from '@/lib/utils/format'
import { Check } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { apiJson } from '@/lib/client/api'
import { useState } from 'react'

interface TicketTierCardProps {
  tier: TicketTier
  concertId: string
}

export function TicketTierCard({ tier, concertId }: TicketTierCardProps) {
  const router = useRouter()
  const [openingQueue, setOpeningQueue] = useState(false)
  const [queueError, setQueueError] = useState<string | null>(null)
  const remaining = tier.capacity - tier.sold
  const isAvailable = remaining > 0
  const availabilityPercent = tier.capacity > 0 ? (remaining / tier.capacity) * 100 : 0

  const nameUpper = tier.name.toUpperCase()
  const isVIP = nameUpper.includes('VIP') && !nameUpper.includes('VVIP')
  const isVVIP = nameUpper.includes('VVIP') || nameUpper.includes('PLATINUM') || nameUpper.includes('CAT 1')

  const enterQueue = async () => {
    setOpeningQueue(true)
    setQueueError(null)
    try {
      const body = await apiJson(`/api/v1/events/${concertId}/active-sales-session`)
      if (typeof body !== 'object' || body === null || !('id' in body) || typeof body.id !== 'string') {
        throw new Error('Respons sales session tidak valid')
      }
      router.push(`/waiting-room?salesSessionId=${body.id}`)
    } catch (error) {
      setQueueError(error instanceof Error ? error.message : 'Antrean tidak dapat dibuka')
      setOpeningQueue(false)
    }
  }

  return (
    <div
      className={cn(
        "group relative border rounded-2xl p-6 bg-zinc-900/80 backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 flex flex-col h-full overflow-hidden",
        isVVIP
          ? "border-violet-500/50 hover:border-violet-500 ring-2 ring-violet-500/20 shadow-[0_8px_30px_rgba(139,92,246,0.1)] scale-[1.02]"
          : isVIP
          ? "border-amber-500/50 hover:border-amber-400/80 shadow-[0_8px_30px_rgba(251,191,36,0.05)] relative before:absolute before:inset-0 before:bg-gradient-to-r before:from-transparent before:via-amber-500/10 before:to-transparent before:translate-x-[-200%] hover:before:animate-shimmer before:pointer-events-none overflow-hidden"
          : "border-white/10 hover:border-white/20 hover:bg-zinc-900"
      )}
    >
      {isVVIP && (
        <div className="absolute top-0 right-0 bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white text-[10px] font-bold px-3 py-1 rounded-bl-lg tracking-wider uppercase">
          Most Popular
        </div>
      )}

      <div className="mb-4">
        <h3 className={cn(
          "text-xl font-black mb-2",
          isVVIP ? "text-violet-400" : isVIP ? "text-amber-400" : "text-white"
        )}>
          {tier.name}
        </h3>
        <div className="flex flex-col gap-1">
          <span className="font-mono text-3xl font-black text-white">{formatIDR(tier.price)}</span>
        </div>
      </div>

      <div className="mb-6 pb-6 border-b border-white/10">
        <div className="flex items-center justify-between text-sm mb-2">
          <span className={isAvailable ? 'text-white/60' : 'text-red-400 font-medium'}>
            {isAvailable ? 'Ketersediaan' : 'Habis'}
          </span>
          {isAvailable && (
            <span className="font-mono font-medium text-white/80">{availabilityPercent.toFixed(0)}%</span>
          )}
        </div>
        
        {/* Availability Bar */}
        <div className="w-full bg-white/5 rounded-full h-1.5 mt-3 overflow-hidden relative">
          <motion.div
            className={cn("absolute left-0 top-0 h-full rounded-full", {
              "bg-emerald-500": availabilityPercent > 50,
              "bg-amber-500": availabilityPercent > 20 && availabilityPercent <= 50,
              "bg-red-500": availabilityPercent <= 20,
            })}
            initial={{ width: 0 }}
            animate={{ width: `${availabilityPercent}%` }}
            transition={{ duration: 0.8, ease: 'easeOut', delay: 0.2 }}
          />
        </div>
        <p className="text-xs text-white/40 mt-2 font-mono">
          {remaining} tiket tersisa
        </p>
      </div>

      <ul className="space-y-3 mb-8 flex-1">
        {tier.perks?.map((perk, i) => (
          <li key={i} className="flex items-start gap-3 text-sm text-white/70 font-body">
            <Check size={16} className={cn(
              "flex-shrink-0 mt-0.5",
              isVVIP ? "text-violet-400" : isVIP ? "text-amber-400" : "text-emerald-400"
            )} />
            <span>{perk}</span>
          </li>
        ))}
      </ul>

      <div className="mt-auto">
          <Button
            type="button"
            onClick={() => void enterQueue()}
            className={cn(
              "w-full py-6 text-base font-bold transition-all duration-300 font-body",
              isAvailable 
                ? isVVIP 
                  ? "bg-violet-600 hover:bg-violet-500 text-white shadow-lg shadow-violet-500/25 group-hover:scale-[1.02]"
                  : isVIP 
                    ? "bg-amber-500 hover:bg-amber-400 text-zinc-950 shadow-lg shadow-amber-500/25 group-hover:scale-[1.02]"
                    : "bg-white text-zinc-950 hover:bg-white/90 group-hover:scale-[1.02]"
                : "bg-white/5 text-white/20 cursor-not-allowed"
            )}
            disabled={!isAvailable || openingQueue}
          >
            {openingQueue ? 'Membuka antrean…' : isAvailable ? 'Masuk Antrean Event' : 'Terjual Habis'}
          </Button>
        {queueError !== null && <p role="alert" className="mt-2 text-xs text-red-400">{queueError}</p>}
      </div>
    </div>
  )
}
