'use client'

import Link from 'next/link'
import {
  AlertOctagon,
  ArrowUpRight,
  CalendarPlus,
  DollarSign,
  PauseCircle,
  Plus,
  Send,
  ShieldAlert,
  TrendingUp,
  Users,
  Zap,
} from 'lucide-react'
import { CapabilityNotice } from '@/components/feedback/capability-notice'
import { Button } from '@/components/ui/button'
import { DesignBackdrop } from '@/components/ui/design-backdrop'

export default function OrganizerCommandCenterPage() {
  return (
    <div className="space-y-8 max-w-7xl">
      {/* Top Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-white/10 pb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="section-label">PROMOTER COMMAND & CONTROL</span>
            <span className="inline-flex items-center gap-1 rounded-full border border-status-success/30 bg-status-success/10 px-2.5 py-0.5 text-[10px] font-bold text-status-success">
              DESIGN PREVIEW · SAMPLE DATA
            </span>
          </div>
          <h1 className="mt-2 font-display text-4xl sm:text-5xl tracking-wide text-foreground">
            COMMAND CENTER KONTROL EVENT
          </h1>
          <p className="text-xs text-muted-foreground">
            Pantau arus pendapatan real-time, beban antrean server, dan kendalikan inventori tiket secara instan.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button asChild className="rounded-xl bg-primary font-bold text-primary-foreground hover:bg-war-gold-bright shadow-[0_0_20px_rgba(240,180,41,0.25)]">
            <Link href="/organizer/events/new">
              <CalendarPlus className="size-4 mr-2" /> Buat Event Baru
            </Link>
          </Button>
        </div>
      </div>

      <CapabilityNotice capability="organizerLiveOperations" />

      {/* Real-time Telemetry Grid */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-3xl border border-white/10 bg-[#141413] p-6 shadow-xl relative overflow-hidden">
          <DesignBackdrop group="war_ticket_organizer_command_center" index={0} variant="card" imageClassName="opacity-20" overlayClassName="bg-black/75" sizes="(max-width: 1024px) 100vw, 25vw" />
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-[11px] font-bold uppercase tracking-wider">Gross Revenue Live</span>
            <DollarSign className="size-4 text-war-gold" />
          </div>
          <p className="mt-3 font-display text-3xl sm:text-4xl text-war-gold-bright">
            Rp 18.450.000.000
          </p>
          <div className="mt-2 flex items-center gap-1.5 text-xs text-status-success">
            <TrendingUp className="size-3.5" /> +42% vs Target Penjualan
          </div>
        </div>

        <div className="rounded-3xl border border-white/10 bg-[#141413] p-6 shadow-xl relative overflow-hidden">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-[11px] font-bold uppercase tracking-wider">Velocity / Throughput</span>
            <Zap className="size-4 text-orange-400" />
          </div>
          <p className="mt-3 font-display text-3xl sm:text-4xl text-foreground">
            45.2 TPS
          </p>
          <p className="mt-2 text-xs text-muted-foreground">Tiket Terjual Per Detik</p>
        </div>

        <div className="rounded-3xl border border-white/10 bg-[#141413] p-6 shadow-xl relative overflow-hidden">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-[11px] font-bold uppercase tracking-wider">Beban Antrean Aktif</span>
            <Users className="size-4 text-cyan-400" />
          </div>
          <p className="mt-3 font-display text-3xl sm:text-4xl text-foreground">
            125.400 Fans
          </p>
          <div className="mt-2 flex items-center gap-1 text-xs text-status-success">
            <span className="pulse-dot size-1.5 rounded-full bg-status-success" /> Rata-rata tunggu: 4 Menit
          </div>
        </div>

        <div className="rounded-3xl border border-white/10 bg-[#141413] p-6 shadow-xl relative overflow-hidden">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-[11px] font-bold uppercase tracking-wider">Serangan Bot Dihalau</span>
            <ShieldAlert className="size-4 text-urgent-red" />
          </div>
          <p className="mt-3 font-display text-3xl sm:text-4xl text-urgent-red">
            1.420 Scalpers
          </p>
          <p className="mt-2 text-xs text-muted-foreground">100% Anti-Bot AI Detection</p>
        </div>
      </section>

      {/* Emergency Control Console */}
      <section className="rounded-3xl border border-white/10 bg-[#141413] p-6 sm:p-8 space-y-6">
        <div className="flex items-center justify-between border-b border-white/8 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-urgent-red/10 text-urgent-red border border-urgent-red/30">
              <AlertOctagon className="size-5" />
            </div>
            <div>
              <h2 className="font-display text-2xl text-foreground">Konsol Tindakan Cepat (Emergency Ops)</h2>
              <p className="text-xs text-muted-foreground">Tindakan darurat live selama perang tiket konser berlangsung.</p>
            </div>
          </div>
          <span className="text-xs font-mono text-muted-foreground hidden sm:block">AUTH LEVEL: PROMOTER ADMIN</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <button
            disabled
            title="Emergency operations belum tersedia"
            className="flex items-center justify-between rounded-2xl border border-urgent-red/40 bg-urgent-red/5 p-5 text-left text-urgent-red opacity-60 cursor-not-allowed"
          >
            <div>
              <h4 className="font-display text-xl">Jeda Penjualan Darurat</h4>
              <p className="text-xs opacity-80">Hentikan sementara war tiket</p>
            </div>
            <PauseCircle className="size-6 shrink-0" />
          </button>

          <button
            disabled
            title="Emergency operations belum tersedia"
            className="flex items-center justify-between rounded-2xl border border-war-gold/40 bg-war-gold/5 p-5 text-left text-war-gold opacity-60 cursor-not-allowed"
          >
            <div>
              <h4 className="font-display text-xl">Rilis Kuota Cadangan</h4>
              <p className="text-xs text-muted-foreground">+500 Tiket Standby ke Antrean</p>
            </div>
            <Plus className="size-6 shrink-0" />
          </button>

          <button
            disabled
            title="Emergency operations belum tersedia"
            className="flex items-center justify-between rounded-2xl border border-blue-500/40 bg-blue-500/5 p-5 text-left text-blue-400 opacity-60 cursor-not-allowed"
          >
            <div>
              <h4 className="font-display text-xl">Push Notifikasi Blast</h4>
              <p className="text-xs text-muted-foreground">Kirim banner ke waiting room</p>
            </div>
            <Send className="size-5 shrink-0" />
          </button>
        </div>
      </section>

      {/* Active Events War Inventory Table */}
      <section className="rounded-3xl border border-white/10 bg-[#141413] p-6 sm:p-8 space-y-6 shadow-xl">
        <div className="flex items-center justify-between border-b border-white/8 pb-4">
          <div>
            <h2 className="font-display text-3xl text-foreground">Inventori Event Aktif</h2>
            <p className="text-xs text-muted-foreground">Status keterisian per tier dan rincian alokasi kuota.</p>
          </div>
          <Link
            href="/organizer/seating-analytics"
            className="text-xs font-bold text-war-gold hover:underline flex items-center gap-1"
          >
            Buka Seating Analytics <ArrowUpRight className="size-3.5" />
          </Link>
        </div>

        <div className="space-y-4">
          <div className="rounded-2xl border border-white/8 bg-black/40 p-5 space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
              <div>
                <span className="rounded-full bg-urgent-red px-2.5 py-0.5 text-[10px] font-black text-white uppercase">
                  WAR LIVE SEKARANG
                </span>
                <h3 className="mt-1.5 font-display text-2xl text-foreground">
                  COLDPLAY LIVE IN JAKARTA 2026
                </h3>
              </div>
              <div className="text-right">
                <span className="font-mono text-sm font-bold text-war-gold-bright">
                  3.300 / 3.500 Terjual (94%)
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
              <div className="rounded-xl bg-white/4 p-3">
                <p className="text-[10px] uppercase text-muted-foreground">VIP STANDING (Rp 3.5M)</p>
                <p className="font-display text-lg text-war-gold">376 / 500 (75%)</p>
              </div>
              <div className="rounded-xl bg-white/4 p-3">
                <p className="text-[10px] uppercase text-muted-foreground">CAT 1 CENTER (Rp 1.85M)</p>
                <p className="font-display text-lg text-cyan-400">1.188 / 1.200 (99%)</p>
              </div>
              <div className="rounded-xl bg-white/4 p-3">
                <p className="text-[10px] uppercase text-muted-foreground">CAT 2 WING (Rp 1.2M)</p>
                <p className="font-display text-lg text-orange-400">1.482 / 1.500 (98%)</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
