'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  Minus,
  Plus,
  RotateCcw,
  Sparkles,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export interface VenueTier {
  id: string
  name: string
  type: 'standing' | 'seated'
  price: number
  originalPrice?: number
  color: string
  availableSeats: number
  totalCapacity: number
  status: 'available' | 'limited' | 'soldout'
  description?: string
  svgPath: string
}

export const defaultVenueTiers: VenueTier[] = [
  {
    id: 'vip',
    name: 'VIP FRONT STAGE',
    type: 'standing',
    price: 3500000,
    originalPrice: 4000000,
    color: '#F0B429',
    availableSeats: 124,
    totalCapacity: 500,
    status: 'available',
    description: 'Akses baris paling depan dekat panggung + Lounge VIP',
    svgPath: 'M 180 160 Q 250 130 320 160 L 340 205 Q 250 165 160 205 Z',
  },
  {
    id: 'cat1',
    name: 'CAT 1 CENTER',
    type: 'seated',
    price: 1850000,
    color: '#5bc9ff',
    availableSeats: 412,
    totalCapacity: 1200,
    status: 'available',
    description: 'Pusat pandangan terbaik langsung ke stage & screen',
    svgPath: 'M 120 230 Q 250 175 380 230 L 410 295 Q 250 220 90 295 Z',
  },
  {
    id: 'cat2',
    name: 'CAT 2 WING',
    type: 'seated',
    price: 1200000,
    color: '#f97316',
    availableSeats: 18,
    totalCapacity: 1500,
    status: 'limited',
    description: 'Tribun sayap kiri dan kanan dengan sudut pandang elevasi',
    svgPath: 'M 70 320 Q 250 245 430 320 L 460 385 Q 250 295 40 385 Z',
  },
  {
    id: 'festival',
    name: 'FESTIVAL GENERAL',
    type: 'standing',
    price: 750000,
    color: '#10B981',
    availableSeats: 0,
    totalCapacity: 3000,
    status: 'soldout',
    description: 'Area berdiri umum di belakang CAT 2',
    svgPath: 'M 20 410 Q 250 320 480 410 L 490 455 Q 250 375 10 455 Z',
  },
]

interface InteractiveVenueMapProps {
  tiers?: VenueTier[]
  selectedTierId?: string
  quantity?: number
  onSelectTier?: (tier: VenueTier) => void
  onQuantityChange?: (qty: number) => void
  onProceed?: () => void
  className?: string
}

export function InteractiveVenueMap({
  tiers = defaultVenueTiers,
  selectedTierId = 'cat1',
  quantity = 1,
  onSelectTier,
  onQuantityChange,
  onProceed,
  className,
}: InteractiveVenueMapProps) {
  const [zoom, setZoom] = useState(1)
  const [currentTierId, setCurrentTierId] = useState(selectedTierId)
  const [currentQty, setCurrentQty] = useState(quantity)

  const selectedTier: VenueTier = tiers.find((t) => t.id === currentTierId) || tiers[0] || defaultVenueTiers[0]!

  const handleTierClick = (tier: VenueTier) => {
    if (tier.status === 'soldout') return
    setCurrentTierId(tier.id)
    onSelectTier?.(tier)
  }

  const handleQtyDelta = (delta: number) => {
    const next = Math.max(1, Math.min(4, currentQty + delta))
    setCurrentQty(next)
    onQuantityChange?.(next)
  }

  const handleZoom = (delta: number) => {
    setZoom((z) => Math.max(0.8, Math.min(1.6, z + delta)))
  }

  const formatRupiah = (val: number) =>
    new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(val)

  return (
    <div className={cn('flex flex-col lg:flex-row h-full min-h-[640px] w-full overflow-hidden rounded-2xl border border-white/10 bg-[#0d0d0d]', className)}>
      {/* Interactive Map Canvas */}
      <div className="relative flex-1 bg-gradient-radial from-[#191918] via-[#101010] to-[#090909] flex flex-col items-center justify-center p-6 min-h-[420px] overflow-hidden">
        {/* Subtle grid background */}
        <div
          className="absolute inset-0 opacity-10 pointer-events-none"
          style={{
            backgroundImage:
              'radial-gradient(circle at 2px 2px, rgba(255,255,255,0.4) 1px, transparent 1px)',
            backgroundSize: '24px 24px',
          }}
        />

        {/* Map Canvas Zoom Controls */}
        <div className="absolute top-4 left-4 z-20 flex flex-col gap-1.5 rounded-xl border border-white/10 bg-black/60 p-1.5 backdrop-blur-xl">
          <button
            onClick={() => handleZoom(0.15)}
            className="flex size-8 items-center justify-center rounded-lg bg-white/5 text-foreground transition hover:bg-white/15 active:scale-95"
            title="Zoom In"
          >
            <Plus className="size-4" />
          </button>
          <button
            onClick={() => handleZoom(-0.15)}
            className="flex size-8 items-center justify-center rounded-lg bg-white/5 text-foreground transition hover:bg-white/15 active:scale-95"
            title="Zoom Out"
          >
            <Minus className="size-4" />
          </button>
          <div className="my-0.5 h-px bg-white/10" />
          <button
            onClick={() => setZoom(1)}
            className="flex size-8 items-center justify-center rounded-lg bg-white/5 text-foreground transition hover:bg-white/15 active:scale-95"
            title="Reset Zoom"
          >
            <RotateCcw className="size-3.5" />
          </button>
        </div>

        {/* Stage Floating Indicator */}
        <div className="absolute top-6 z-10">
          <div className="flex items-center gap-2 rounded-full border border-war-gold/40 bg-black/70 px-6 py-2 shadow-[0_0_20px_rgba(240,180,41,0.2)] backdrop-blur-xl">
            <span className="pulse-dot size-2 rounded-full bg-war-gold" />
            <span className="font-display text-base tracking-[0.25em] text-foreground">
              MAIN STAGE
            </span>
          </div>
        </div>

        {/* Stadium Map SVG */}
        <motion.div
          animate={{ scale: zoom }}
          transition={{ type: 'spring', stiffness: 200, damping: 25 }}
          className="relative aspect-square w-full max-w-[460px] p-2"
        >
          <svg className="size-full drop-shadow-[0_15px_35px_rgba(0,0,0,0.8)]" viewBox="0 0 500 500">
            {/* Stage physical platform */}
            <path
              d="M 140 90 Q 250 45 360 90 L 360 115 Q 250 75 140 115 Z"
              fill="url(#stageMetallicGradient)"
              stroke="rgba(240, 180, 41, 0.4)"
              strokeWidth="1.5"
            />
            <defs>
              <linearGradient id="stageMetallicGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#1e1e1d" />
                <stop offset="50%" stopColor="#3d3d3a" />
                <stop offset="100%" stopColor="#1e1e1d" />
              </linearGradient>
            </defs>

            {/* Stadium Sectors */}
            {tiers.map((tier) => {
              const isSelected = tier.id === currentTierId
              const isSoldOut = tier.status === 'soldout'

              return (
                <g key={tier.id} onClick={() => handleTierClick(tier)} className={cn('transition-transform duration-200', isSoldOut ? 'cursor-not-allowed opacity-40' : 'cursor-pointer hover:opacity-100')}>
                  <path
                    d={tier.svgPath}
                    fill={tier.color}
                    opacity={isSelected ? 0.95 : isSoldOut ? 0.3 : 0.65}
                    stroke={isSelected ? '#ffffff' : 'rgba(255,255,255,0.2)'}
                    strokeWidth={isSelected ? 3.5 : 1}
                    className="transition-all duration-300"
                    style={{
                      filter: isSelected ? `drop-shadow(0 0 12px ${tier.color})` : undefined,
                    }}
                  />
                </g>
              )
            })}

            {/* Sector Text Labels */}
            <text x="250" y="185" textAnchor="middle" fill="#000000" fontFamily="Plus Jakarta Sans" fontSize="13" fontWeight="800">
              VIP FRONT
            </text>
            <text x="250" y="260" textAnchor="middle" fill="#000000" fontFamily="Plus Jakarta Sans" fontSize="13" fontWeight="800">
              CAT 1 CENTER
            </text>
            <text x="250" y="355" textAnchor="middle" fill="#ffffff" fontFamily="Plus Jakarta Sans" fontSize="13" fontWeight="800">
              CAT 2 WING
            </text>
            <text x="250" y="435" textAnchor="middle" fill="#ffffff" fontFamily="Plus Jakarta Sans" fontSize="13" fontWeight="800">
              FESTIVAL (SOLD OUT)
            </text>
          </svg>
        </motion.div>

        {/* Legend */}
        <div className="absolute bottom-4 left-4 z-10 flex flex-wrap items-center gap-3 rounded-xl border border-white/10 bg-black/60 px-4 py-2 text-[11px] backdrop-blur-md">
          <div className="flex items-center gap-1.5">
            <span className="size-2.5 rounded-sm bg-war-gold" /> Tersedia
          </div>
          <div className="flex items-center gap-1.5">
            <span className="size-2.5 rounded-sm bg-orange-500" /> Sisa Sedikit
          </div>
          <div className="flex items-center gap-1.5 opacity-60">
            <span className="size-2.5 rounded-sm bg-white/20" /> Habis Terjual
          </div>
        </div>
      </div>

      {/* Right Selection Panel */}
      <div className="flex w-full flex-col border-t lg:border-t-0 lg:border-l border-white/10 bg-[#141413]/90 lg:w-[420px] backdrop-blur-2xl">
        {/* Header */}
        <div className="border-b border-white/10 p-5">
          <div className="flex items-center justify-between">
            <h3 className="font-display text-2xl tracking-wide text-foreground">PILIH TIER TIKET</h3>
            <span className="inline-flex items-center gap-1 rounded-full border border-war-gold/30 bg-war-gold/10 px-2.5 py-0.5 text-[10px] font-bold text-war-gold-bright uppercase tracking-wider">
              <Sparkles className="size-3" /> Live Inventory
            </span>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            Klik zona pada denah atau pilih salah satu kategori di bawah.
          </p>
        </div>

        {/* Categories List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 max-h-[380px] lg:max-h-none">
          {tiers.map((tier) => {
            const isSelected = tier.id === currentTierId
            const isSoldOut = tier.status === 'soldout'
            const isLimited = tier.status === 'limited'

            return (
              <div
                key={tier.id}
                onClick={() => handleTierClick(tier)}
                className={cn(
                  'relative rounded-2xl border p-4 transition-all duration-200',
                  isSelected
                    ? 'border-war-gold bg-white/6 shadow-[0_0_20px_rgba(240,180,41,0.15)]'
                    : isSoldOut
                    ? 'cursor-not-allowed border-white/5 bg-black/20 opacity-45'
                    : 'cursor-pointer border-white/8 bg-white/3 hover:border-white/20 hover:bg-white/5'
                )}
              >
                {/* Left color bar */}
                <div
                  className="absolute left-0 top-3 bottom-3 w-1.5 rounded-r"
                  style={{ backgroundColor: tier.color }}
                />

                <div className="flex items-start justify-between pl-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-display text-lg tracking-wide text-foreground">
                        {tier.name}
                      </h4>
                      {isSelected && (
                        <span className="rounded-full bg-war-gold px-2 py-0.5 text-[10px] font-black text-black">
                          TERPILIH
                        </span>
                      )}
                      {isLimited && !isSelected && (
                        <span className="rounded-full border border-orange-500/30 bg-orange-500/10 px-2 py-0.5 text-[10px] font-bold text-orange-400">
                          SISA {tier.availableSeats}
                        </span>
                      )}
                    </div>
                    <p className="mt-0.5 text-xs text-muted-foreground">{tier.description}</p>
                  </div>

                  <div className="text-right">
                    {tier.originalPrice && (
                      <span className="text-[11px] text-muted-foreground line-through">
                        {formatRupiah(tier.originalPrice)}
                      </span>
                    )}
                    <p className="font-display text-lg tracking-wide text-war-gold">
                      {formatRupiah(tier.price)}
                    </p>
                  </div>
                </div>

                {/* Progress bar of availability */}
                <div className="mt-3 ml-2 h-1 w-full overflow-hidden rounded-full bg-white/8">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${Math.round((tier.availableSeats / tier.totalCapacity) * 100)}%`,
                      backgroundColor: tier.color,
                    }}
                  />
                </div>
              </div>
            )
          })}
        </div>

        {/* Selection Summary & Counter Dock */}
        <div className="border-t border-white/10 bg-black/40 p-5">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[11px] font-semibold text-muted-foreground uppercase">
                Jumlah Tiket (Maks. 4)
              </span>
              <div className="mt-1 flex items-center gap-3">
                <button
                  onClick={() => handleQtyDelta(-1)}
                  disabled={currentQty <= 1}
                  className="flex size-8 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-foreground transition hover:bg-white/15 disabled:opacity-30"
                >
                  <Minus className="size-3.5" />
                </button>
                <span className="font-display text-2xl font-bold text-foreground">
                  {currentQty}
                </span>
                <button
                  onClick={() => handleQtyDelta(1)}
                  disabled={currentQty >= 4}
                  className="flex size-8 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-foreground transition hover:bg-white/15 disabled:opacity-30"
                >
                  <Plus className="size-3.5" />
                </button>
              </div>
            </div>

            <div className="text-right">
              <span className="text-[11px] font-semibold text-muted-foreground uppercase">
                Total Estimasi
              </span>
              <p className="font-display text-2xl font-bold tracking-wide text-war-gold-bright">
                {formatRupiah(selectedTier.price * currentQty)}
              </p>
            </div>
          </div>

          <Button
            onClick={onProceed}
            className="mt-4 w-full rounded-xl bg-primary py-6 font-bold text-primary-foreground transition hover:bg-war-gold-bright active:scale-[0.99]"
          >
            Lanjut ke Pembayaran ({currentQty} Tiket)
          </Button>
        </div>
      </div>
    </div>
  )
}
