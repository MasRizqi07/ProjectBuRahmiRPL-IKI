'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  Activity,
  AlertTriangle,
  ArrowUpRight,
  Check,
  CheckCircle2,
  Cpu,
  DollarSign,
  Globe,
  HardDrive,
  History,
  Radio,
  Server,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Ticket,
  TrendingUp,
  UserCheck,
  Users,
  X,
  Zap,
} from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function PlatformAdminDashboardPage() {
  const [approvals, setApprovals] = useState([
    { id: 'EVT-091', title: 'Bruno Mars 24K Magic World Tour Jakarta', organizer: 'Live Nation Indonesia', date: '20 Okt 2026', venue: 'GBK Stadium', capacity: '75.000 Tiket', gmv: 'Rp 65.000.000.000' },
    { id: 'EVT-092', title: 'Dua Lipa Radical Optimism Tour', organizer: 'PK Entertainment', date: '05 Nov 2026', venue: 'Indonesia Arena', capacity: '16.000 Tiket', gmv: 'Rp 22.000.000.000' },
  ])

  const handleApprove = (id: string) => {
    setApprovals(approvals.filter((a) => a.id !== id))
  }

  return (
    <div className="space-y-8 max-w-7xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-white/10 pb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="section-label">GLOBAL ECOSYSTEM OVERSIGHT</span>
            <span className="inline-flex items-center gap-1 rounded-full border border-purple-500/30 bg-purple-500/10 px-2.5 py-0.5 text-[10px] font-bold text-purple-400">
              <ShieldCheck className="size-3" /> SUPER ADMIN CLEARANCE
            </span>
          </div>
          <h1 className="mt-2 font-display text-4xl sm:text-5xl tracking-wide text-foreground">
            PLATFORM MASTER CONTROL
          </h1>
          <p className="text-xs text-muted-foreground">
            Telemetri global, verifikasi persetujuan konser baru, pemantauan server cluster, dan keamanan transaksi.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button asChild variant="outline" className="rounded-xl border-white/15 bg-white/5 text-xs font-bold hover:border-war-gold/40">
            <Link href="/admin/security">
              <ShieldAlert className="size-4 mr-1.5 text-urgent-red" /> Security Defense
            </Link>
          </Button>
          <Button asChild className="rounded-xl bg-primary text-xs font-bold text-primary-foreground hover:bg-war-gold-bright shadow-[0_0_15px_rgba(240,180,41,0.2)]">
            <Link href="/admin/audit-logs">
              <History className="size-4 mr-1.5" /> Audit Trail Logs
            </Link>
          </Button>
        </div>
      </div>

      {/* Global Ecosystem Metrics */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-3xl border border-white/10 bg-[#141413] p-6 shadow-xl">
          <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Total GMV Ekosistem</span>
          <p className="mt-2 font-display text-3xl sm:text-4xl text-war-gold-bright">Rp 142.850.000.000</p>
          <p className="mt-1 text-xs text-status-success font-semibold">● 28 Event Aktif Terdaftar</p>
        </div>

        <div className="rounded-3xl border border-white/10 bg-[#141413] p-6 shadow-xl">
          <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Concurrent Fans Online</span>
          <p className="mt-2 font-display text-3xl sm:text-4xl text-foreground">245.890</p>
          <p className="mt-1 text-xs text-cyan-400">Peak War Room Traffic</p>
        </div>

        <div className="rounded-3xl border border-white/10 bg-[#141413] p-6 shadow-xl">
          <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Cluster Redis / DB Load</span>
          <p className="mt-2 font-display text-3xl sm:text-4xl text-status-success">34.2% Load</p>
          <p className="mt-1 text-xs text-muted-foreground">Kapasitas Maks: 50.000 TPS</p>
        </div>

        <div className="rounded-3xl border border-white/10 bg-[#141413] p-6 shadow-xl">
          <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Anti-Bot Shield Status</span>
          <p className="mt-2 font-display text-3xl sm:text-4xl text-foreground">DEFCON 4</p>
          <p className="mt-1 text-xs text-status-success">Semua Filter Cloudflare Normal</p>
        </div>
      </section>

      {/* Pending Event Approvals Queue */}
      <section className="rounded-3xl border border-white/10 bg-[#141413] p-6 sm:p-8 space-y-6 shadow-xl">
        <div className="flex items-center justify-between border-b border-white/8 pb-4">
          <div>
            <h2 className="font-display text-3xl text-foreground">Antrean Persetujuan Event Promotor</h2>
            <p className="text-xs text-muted-foreground">Verifikasi keaslian lisensi promotor sebelum tiket dibuka untuk publik.</p>
          </div>
          <span className="rounded-full bg-war-gold/10 border border-war-gold/30 px-3 py-1 text-xs font-bold text-war-gold">
            {approvals.length} Menunggu Approval
          </span>
        </div>

        {approvals.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-white/10 p-8 text-center text-muted-foreground text-xs">
            Tidak ada event baru yang menunggu verifikasi.
          </div>
        ) : (
          <div className="space-y-4">
            {approvals.map((evt) => (
              <div
                key={evt.id}
                className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 rounded-2xl border border-white/8 bg-black/40 p-5 hover:border-war-gold/30 transition"
              >
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-war-gold">{evt.id}</span>
                    <span className="text-xs font-semibold text-muted-foreground">Promotor: {evt.organizer}</span>
                  </div>
                  <h3 className="font-display text-2xl text-foreground">{evt.title}</h3>
                  <p className="text-xs text-muted-foreground">
                    {evt.date} • {evt.venue} • Kapasitas: <strong className="text-foreground">{evt.capacity}</strong> • Proyeksi GMV: <strong className="text-war-gold-bright">{evt.gmv}</strong>
                  </p>
                </div>

                <div className="flex items-center gap-2 w-full lg:w-auto shrink-0 justify-end border-t lg:border-t-0 border-white/8 pt-4 lg:pt-0">
                  <Button
                    onClick={() => handleApprove(evt.id)}
                    className="flex-1 lg:flex-initial rounded-xl bg-status-success text-black font-bold hover:bg-emerald-400 text-xs"
                  >
                    <Check className="size-4 mr-1.5" /> Setujui & Rilis Event
                  </Button>
                  <Button
                    onClick={() => handleApprove(evt.id)}
                    variant="outline"
                    className="rounded-xl border-urgent-red/40 text-urgent-red hover:bg-urgent-red/10 text-xs"
                  >
                    <X className="size-4 mr-1.5" /> Tolak
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Global Server Cluster Health Telemetry */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="rounded-3xl border border-white/10 bg-[#141413] p-6 space-y-3">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span className="font-bold uppercase">Node Cluster JKT-01</span>
            <span className="text-status-success font-bold">● Healthy</span>
          </div>
          <p className="font-display text-2xl text-foreground">Stadion GBK Gateway</p>
          <div className="space-y-1 text-[11px] text-muted-foreground">
            <div className="flex justify-between"><span>CPU Core Load:</span> <span className="font-mono text-foreground">28%</span></div>
            <div className="flex justify-between"><span>Memory Allocation:</span> <span className="font-mono text-foreground">16.4 GB / 64 GB</span></div>
            <div className="flex justify-between"><span>Ping Latency:</span> <span className="font-mono text-status-success font-bold">8ms</span></div>
          </div>
        </div>

        <div className="rounded-3xl border border-white/10 bg-[#141413] p-6 space-y-3">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span className="font-bold uppercase">Node Cluster SGP-02</span>
            <span className="text-status-success font-bold">● Healthy</span>
          </div>
          <p className="font-display text-2xl text-foreground">Singapore Regional Edge</p>
          <div className="space-y-1 text-[11px] text-muted-foreground">
            <div className="flex justify-between"><span>CPU Core Load:</span> <span className="font-mono text-foreground">41%</span></div>
            <div className="flex justify-between"><span>Memory Allocation:</span> <span className="font-mono text-foreground">24.1 GB / 64 GB</span></div>
            <div className="flex justify-between"><span>Ping Latency:</span> <span className="font-mono text-status-success font-bold">14ms</span></div>
          </div>
        </div>

        <div className="rounded-3xl border border-white/10 bg-[#141413] p-6 space-y-3">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span className="font-bold uppercase">Redis Lock Engine</span>
            <span className="text-status-success font-bold">● Zero Collisions</span>
          </div>
          <p className="font-display text-2xl text-foreground">Atomic Seat Locks</p>
          <div className="space-y-1 text-[11px] text-muted-foreground">
            <div className="flex justify-between"><span>Active Reservation Holds:</span> <span className="font-mono text-war-gold font-bold">1.482 Holds</span></div>
            <div className="flex justify-between"><span>Eviction Rate:</span> <span className="font-mono text-foreground">0.00%</span></div>
            <div className="flex justify-between"><span>Throughput:</span> <span className="font-mono text-foreground">48.9k ops/sec</span></div>
          </div>
        </div>
      </section>
    </div>
  )
}

