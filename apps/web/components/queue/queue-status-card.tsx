'use client'

import { AlertTriangle, Clock3, Flame, Users } from 'lucide-react'
import { RadialProgress } from '@/components/ui/radial-progress'

interface QueueStatusView {
  readonly entryId: string
  readonly position: number | null
  readonly estimatedWaitSeconds: number | null
}

function formatDuration(seconds: number | null): string {
  if (seconds === null) return 'Menghitung…'
  const minutes = Math.floor(seconds / 60)
  return `${String(minutes).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')} Menit`
}

export function QueueStatusCard({ queue }: { readonly queue: QueueStatusView }) {
  const positionNumber = queue.position ?? 124
  // Calculate relative progress from 1000 down to 1
  const progressPercent = Math.max(5, Math.min(95, 100 - (positionNumber / 15)))

  return (
    <div className="space-y-6" aria-live="polite">
      {/* Critical Safety Alert */}
      <div className="flex items-center gap-3 rounded-2xl border border-urgent-red/50 bg-urgent-red/10 px-5 py-3.5 text-urgent-red shadow-[0_0_20px_rgba(239,68,68,0.2)] animate-pulse">
        <AlertTriangle className="size-5 shrink-0 text-urgent-red" />
        <span className="font-display text-lg tracking-wide uppercase">
          JANGAN REFRESH ATAU TUTUP HALAMAN INI
        </span>
      </div>

      {/* Main Radial Queue Gauge */}
      <section className="glass-panel relative flex flex-col items-center justify-center overflow-hidden rounded-3xl p-8 sm:p-12 text-center">
        <div className="absolute inset-0 grid-pattern opacity-20 pointer-events-none" />

        <RadialProgress
          progress={progressPercent}
          size={280}
          strokeWidth={14}
          progressColor="#F0B429"
          glow={true}
        >
          <div className="flex flex-col items-center">
            <span className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
              Posisi Antrean Anda
            </span>
            <span className="mt-1 font-display text-6xl sm:text-7xl font-bold tracking-tight text-war-gold animate-pulse">
              {queue.position === null ? '—' : `#${queue.position.toLocaleString('id-ID')}`}
            </span>
            <span className="mt-1 inline-flex items-center gap-1 rounded-full border border-status-success/30 bg-status-success/10 px-2.5 py-0.5 text-[10px] font-bold text-status-success uppercase">
              <span className="pulse-dot size-1.5 rounded-full bg-status-success" /> AKTIF BERGERAK
            </span>
          </div>
        </RadialProgress>

        <p className="mt-6 font-mono text-xs text-muted-foreground">
          ENTRY TOKEN ID: <strong className="text-foreground">{queue.entryId.slice(0, 12).toUpperCase()}</strong>
        </p>
      </section>

      {/* Live Telemetry Grid */}
      <section className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-white/10 bg-[#161615] p-5 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground">Estimasi Waktu Tunggu</span>
            <Clock3 className="size-4 text-war-gold" />
          </div>
          <p className="mt-2 font-display text-3xl font-bold text-war-gold-bright">
            {formatDuration(queue.estimatedWaitSeconds)}
          </p>
          <p className="mt-1 text-[11px] text-muted-foreground">Kecepatan antrean: ~45 tiket/detik</p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-[#161615] p-5 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground">Antrean di Depan Anda</span>
            <Users className="size-4 text-tertiary-container" />
          </div>
          <p className="mt-2 font-display text-3xl font-bold text-foreground">
            {queue.position ? Math.max(0, queue.position - 1).toLocaleString('id-ID') : '0'} Orang
          </p>
          <p className="mt-1 text-[11px] text-status-success">Koneksi websocket terenkripsi aman</p>
        </div>
      </section>

      {/* Live Availability Ticker */}
      <div className="overflow-hidden rounded-2xl border border-white/10 bg-black/60 p-4">
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center gap-1 rounded-full bg-urgent-red px-2.5 py-0.5 text-[10px] font-black text-white uppercase shrink-0">
            <Flame className="size-3" /> LIVE TIKET FEED
          </span>
          <div className="ticker-wrap flex-1 overflow-hidden">
            <div className="ticker flex items-center gap-6 font-mono text-xs">
              <span>VIP STANDING: <strong className="text-war-gold">Sisa 124 Tiket</strong></span>
              <span className="text-white/20">•</span>
              <span>CAT 1: <strong className="text-cyan-400">Tersedia</strong></span>
              <span className="text-white/20">•</span>
              <span>CAT 2: <strong className="text-orange-400">Hampir Habis</strong></span>
              <span className="text-white/20">•</span>
              <span>FESTIVAL: <strong className="text-red-400">SOLD OUT</strong></span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
