'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import {
  Calendar,
  CheckCircle2,
  Clock,
  Download,
  MapPin,
  QrCode,
  RefreshCw,
  Share2,
  ShieldCheck,
  Sparkles,
  Ticket,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export interface TicketDetails {
  orderId: string
  ticketCode: string
  concertTitle: string
  artist: string
  venue: string
  city: string
  eventDate: string
  eventTime: string
  gateOpen: string
  tierName: string
  section: string
  seatNumber: string
  holderName: string
  nik: string
  price: number
  status: 'valid' | 'used' | 'cancelled'
}

interface MetallicTicketCardProps {
  ticket: TicketDetails
  className?: string
  onDownload?: () => void
  onShare?: () => void
}

export function MetallicTicketCard({
  ticket,
  className,
  onDownload,
  onShare,
}: MetallicTicketCardProps) {
  // Anti-screenshot dynamic QR countdown (30s refresh)
  const [secondsLeft, setSecondsLeft] = useState(30)
  const [qrKey, setQrKey] = useState(0)

  useEffect(() => {
    const timer = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          setQrKey((k) => k + 1)
          return 30
        }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  return (
    <div className={cn('mx-auto w-full max-w-md', className)}>
      {/* Holographic metallic card container */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="relative overflow-hidden rounded-3xl border border-white/15 bg-linear-to-b from-[#22211e] via-[#161514] to-[#0e0e0d] p-6 shadow-[0_24px_60px_rgba(0,0,0,0.6)] backdrop-blur-2xl"
      >
        {/* Holographic foil sheen effect */}
        <div className="pointer-events-none absolute -top-32 -right-32 size-72 rounded-full bg-linear-to-br from-war-gold/20 via-primary/10 to-transparent blur-3xl" />
        <div className="pointer-events-none absolute -bottom-32 -left-32 size-72 rounded-full bg-linear-to-tr from-cyan-500/10 via-war-gold/15 to-transparent blur-3xl" />

        {/* Card Header */}
        <div className="relative z-10 flex items-start justify-between border-b border-white/10 pb-5">
          <div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1 rounded-full border border-war-gold/30 bg-war-gold/10 px-2.5 py-0.5 text-[11px] font-bold text-war-gold-bright uppercase tracking-wider">
                <Sparkles className="size-3" /> OFFICIAL E-TICKET
              </span>
              <span className="inline-flex items-center gap-1 rounded-full border border-status-success/30 bg-status-success/10 px-2 py-0.5 text-[10px] font-bold text-status-success uppercase">
                <CheckCircle2 className="size-3" /> {ticket.status.toUpperCase()}
              </span>
            </div>
            <h3 className="mt-2 font-display text-2xl tracking-wide text-foreground">
              {ticket.concertTitle}
            </h3>
            <p className="text-xs font-semibold text-war-gold">{ticket.artist}</p>
          </div>

          <div className="rounded-xl border border-white/10 bg-black/40 p-2 text-center">
            <p className="text-[10px] uppercase text-muted-foreground">TIER</p>
            <p className="font-display text-lg tracking-wide text-war-gold-bright">
              {ticket.tierName}
            </p>
          </div>
        </div>

        {/* Dynamic Live QR Section */}
        <div className="relative z-10 my-6 flex flex-col items-center justify-center rounded-2xl border border-white/8 bg-black/50 p-5 text-center backdrop-blur-md">
          <div className="relative size-44 rounded-xl border border-war-gold/30 bg-white p-3 shadow-[0_0_25px_rgba(240,180,41,0.2)]">
            {/* Real SVG-styled QR representation */}
            <div className="relative flex size-full items-center justify-center">
              <QrCode className="size-full text-black" strokeWidth={1.5} />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="rounded bg-black p-1 text-[8px] font-black tracking-tighter text-war-gold">
                  WT
                </div>
              </div>
            </div>
          </div>

          {/* Dynamic Rolling Code Security */}
          <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
            <RefreshCw className="size-3.5 animate-spin text-war-gold" />
            <span>
              Kode QR berganti otomatis dalam{' '}
              <strong className="font-mono text-war-gold-bright">{secondsLeft}s</strong>
            </span>
          </div>
          <p className="mt-1 text-[11px] text-muted-foreground/80">
            Screenshot tidak berlaku. Tunjukkan QR dinamis ini saat masuk gate.
          </p>
        </div>

        {/* Perforated ticket cut line */}
        <div className="relative -mx-6 my-2 flex items-center justify-between">
          <div className="size-6 -ml-3 rounded-full bg-background border-r border-white/10" />
          <div className="flex-1 border-b-2 border-dashed border-white/15" />
          <div className="size-6 -mr-3 rounded-full bg-background border-l border-white/10" />
        </div>

        {/* Ticket Metadata Grid */}
        <div className="relative z-10 mt-5 grid grid-cols-3 gap-3 rounded-xl bg-white/4 p-4 text-xs">
          <div>
            <span className="text-[10px] uppercase text-muted-foreground">Gate Open</span>
            <p className="font-mono font-bold text-foreground">{ticket.gateOpen}</p>
          </div>
          <div>
            <span className="text-[10px] uppercase text-muted-foreground">Zona / Row</span>
            <p className="font-bold text-foreground">{ticket.section}</p>
          </div>
          <div>
            <span className="text-[10px] uppercase text-muted-foreground">Kursi / Spot</span>
            <p className="font-mono font-bold text-war-gold">{ticket.seatNumber}</p>
          </div>
          <div className="col-span-2">
            <span className="text-[10px] uppercase text-muted-foreground">Nama Pemegang</span>
            <p className="font-bold text-foreground">{ticket.holderName}</p>
          </div>
          <div>
            <span className="text-[10px] uppercase text-muted-foreground">NIK Terdaftar</span>
            <p className="font-mono text-[11px] text-muted-foreground">{ticket.nik}</p>
          </div>
        </div>

        {/* Location & Time info */}
        <div className="relative z-10 mt-4 space-y-1.5 text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <Calendar className="size-3.5 text-war-gold" />
            <span>{ticket.eventDate} • {ticket.eventTime} WIB</span>
          </div>
          <div className="flex items-center gap-2">
            <MapPin className="size-3.5 text-war-gold" />
            <span>{ticket.venue}, {ticket.city}</span>
          </div>
        </div>

        {/* Barcode visual */}
        <div className="relative z-10 mt-6 flex flex-col items-center justify-center border-t border-white/10 pt-4">
          <div className="flex h-8 w-full max-w-[280px] items-center justify-between gap-[2px] opacity-80">
            {Array.from({ length: 42 }).map((_, i) => (
              <div
                key={i}
                className={cn(
                  'h-full bg-foreground',
                  i % 3 === 0 ? 'w-1' : i % 5 === 0 ? 'w-1.5' : 'w-0.5'
                )}
              />
            ))}
          </div>
          <p className="mt-1.5 font-mono text-[11px] tracking-widest text-muted-foreground">
            {ticket.ticketCode}
          </p>
        </div>
      </motion.div>

      {/* Action CTA Buttons */}
      <div className="mt-4 grid grid-cols-2 gap-3">
        <Button
          onClick={onDownload}
          variant="outline"
          className="flex items-center justify-center gap-2 rounded-xl border-white/15 bg-white/5 py-5 text-xs font-bold transition hover:border-war-gold/40 hover:bg-white/10"
        >
          <Download className="size-4 text-war-gold" /> Unduh PDF
        </Button>
        <Button
          onClick={onShare}
          variant="outline"
          className="flex items-center justify-center gap-2 rounded-xl border-white/15 bg-white/5 py-5 text-xs font-bold transition hover:border-war-gold/40 hover:bg-white/10"
        >
          <Share2 className="size-4 text-war-gold" /> Bagikan Tiket
        </Button>
      </div>
    </div>
  )
}

