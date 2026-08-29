import Link from 'next/link'
import {
  ArrowRight,
  Award,
  Crown,
  MapPin,
  ShieldCheck,
  Sparkles,
  Ticket,
  TrendingUp,
  User,
  Wifi,
  Zap,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { DesignBackdrop } from '@/components/ui/design-backdrop'

export const metadata = {
  title: 'Dashboard Pengguna — WAR TICKET',
  description: 'Pusat komando akun tiket, statistik war, dan inventori tiket konser Anda.',
}

export default function UserDashboardPage() {
  return (
    <main className="container-shell py-8 sm:py-12 space-y-10">
      {/* Welcome Header */}
      <section className="glass-panel relative overflow-hidden rounded-3xl p-6 sm:p-10 border border-white/10">
        <DesignBackdrop group="war_ticket_user_dashboard" index={0} imageClassName="opacity-30" overlayClassName="bg-linear-to-r from-black/95 via-black/80 to-black/55" />
        <div className="absolute -top-24 -right-24 size-72 rounded-full bg-war-gold/15 blur-3xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col items-start justify-between gap-6 md:flex-row md:items-center">
          <div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-war-gold/30 bg-war-gold/10 px-3 py-1 text-xs font-bold text-war-gold-bright uppercase tracking-wider">
                <Sparkles className="size-3.5" /> USER COMMAND DASHBOARD
              </span>
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-status-success">
                <span className="pulse-dot size-1.5 rounded-full bg-status-success" /> KONEKSI AKTIF
              </span>
            </div>
            <h1 className="mt-3 font-display text-4xl sm:text-6xl tracking-wide text-foreground">
              SIAP TEMPUR, <span className="text-war-gold">RIZQI PRATAMA</span>
            </h1>
            <p className="mt-1 text-xs sm:text-sm text-muted-foreground max-w-xl">
              Arsenal tiket Anda aktif. 3 drop tiket festival besar dalam 24 jam ke depan. Persiapkan koneksi Anda.
            </p>
          </div>

          <div className="flex flex-col items-end gap-2 shrink-0">
            <div className="flex items-center gap-3 rounded-2xl border border-war-gold/40 bg-black/60 px-5 py-3 shadow-[0_0_25px_rgba(240,180,41,0.2)] backdrop-blur-xl">
              <div className="flex size-10 items-center justify-center rounded-xl bg-war-gold text-black font-bold">
                <Award className="size-5" />
              </div>
              <div>
                <p className="text-[10px] uppercase font-bold text-muted-foreground">WAR RANK LEVEL</p>
                <p className="font-display text-xl tracking-wide text-war-gold-bright">
                  PLATINUM VANGUARD
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Bento Grid: Active War Target + Network Telemetry */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Target Card (2 cols) */}
        <div className="lg:col-span-2 rounded-3xl border border-white/10 bg-[#141413] overflow-hidden group hover:border-war-gold/40 transition-all shadow-xl">
          <div className="relative h-56 sm:h-64 bg-linear-to-t from-[#141413] to-black/60 p-6 flex flex-col justify-between">
            <div className="flex items-center justify-between z-10">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-urgent-red px-3 py-1 text-xs font-bold text-white shadow-[0_0_15px_rgba(239,68,68,0.5)]">
                <span className="pulse-dot size-2 rounded-full bg-white" /> WAR DROP LIVE IN 02:45:10
              </span>
              <span className="rounded-full border border-white/20 bg-black/50 px-3 py-1 text-xs font-semibold backdrop-blur-md">
                K-Pop World Tour
              </span>
            </div>

            <div className="z-10">
              <span className="text-xs font-bold uppercase tracking-widest text-war-gold">
                TARGET UTAMA HARI INI
              </span>
              <h3 className="font-display text-3xl sm:text-4xl tracking-wide text-foreground">
                BLACKPINK WORLD TOUR 2026 JAKARTA
              </h3>
              <p className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                <MapPin className="size-3.5 text-war-gold" /> Stadion Utama Gelora Bung Karno
              </p>
            </div>
          </div>

          <div className="p-6 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="w-full sm:w-auto">
              <p className="text-xs text-muted-foreground">Estimasi Antrean War:</p>
              <p className="font-display text-2xl font-bold text-foreground">
                125.000+ Pembeli Bersamaan
              </p>
            </div>

            <Button asChild className="w-full sm:w-auto rounded-xl bg-primary px-7 py-5 font-bold text-primary-foreground hover:bg-war-gold-bright shadow-[0_0_20px_rgba(240,180,41,0.25)]">
              <Link href="/waiting-room?title=BLACKPINK+Live+Show">
                <Zap className="size-4 mr-1.5" /> Masuk Waiting Room
              </Link>
            </Button>
          </div>
        </div>

        {/* Right Column: Telemetry & Quick Action */}
        <div className="space-y-6">
          {/* Network ping card */}
          <div className="rounded-3xl border border-white/10 bg-[#161615] p-6 relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                STATUS KONEKSI WAR
              </span>
              <Wifi className="size-4 text-status-success" />
            </div>
            <div className="mt-4 flex items-center gap-4">
              <div className="flex size-14 items-center justify-center rounded-2xl border border-status-success/30 bg-status-success/10 text-status-success">
                <span className="font-mono text-xl font-bold">12ms</span>
              </div>
              <div>
                <p className="font-display text-xl text-foreground">LATENSI OPTIMAL</p>
                <p className="text-xs text-status-success">Sangat Siap Untuk War Tiket</p>
              </div>
            </div>
          </div>

          {/* Quick Ticket Box */}
          <div className="rounded-3xl border border-white/10 bg-linear-to-br from-white/4 to-transparent p-6 hover:border-war-gold/40 transition group">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-display text-2xl text-foreground group-hover:text-war-gold transition">
                  TIKET SAYA (1 AKTIF)
                </h4>
                <p className="text-xs text-muted-foreground">Coldplay Live in Jakarta • VIP-A</p>
              </div>
              <Link
                href="/my-tickets"
                className="flex size-10 items-center justify-center rounded-xl bg-white/5 border border-white/10 group-hover:bg-war-gold group-hover:text-black transition"
              >
                <ArrowRight className="size-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* User Stats Grid */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Tiket Dimenangkan', value: '7 Tiket', icon: Ticket, color: 'text-war-gold' },
          { label: 'War Win Rate', value: '100%', icon: TrendingUp, color: 'text-status-success' },
          { label: 'Loyalty Points', value: '4.850 Pts', icon: Crown, color: 'text-amber-300' },
          { label: 'Anti-Bot Security', value: 'Level 5 (Verified)', icon: ShieldCheck, color: 'text-cyan-400' },
        ].map((item) => {
          const Icon = item.icon
          return (
            <div key={item.label} className="rounded-2xl border border-white/8 bg-[#141413] p-5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-muted-foreground uppercase">{item.label}</span>
                <Icon className={`size-4 ${item.color}`} />
              </div>
              <p className="mt-2 font-display text-2xl font-bold text-foreground">{item.value}</p>
            </div>
          )
        })}
      </section>

      {/* Quick Navigation Cards */}
      <section className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
        <Link
          href="/my-tickets"
          className="flex items-center gap-4 rounded-2xl border border-white/8 bg-[#141413] p-5 hover:border-war-gold/40 transition group"
        >
          <div className="flex size-12 items-center justify-center rounded-xl bg-war-gold/10 text-war-gold">
            <Ticket className="size-6" />
          </div>
          <div>
            <h4 className="font-display text-xl text-foreground group-hover:text-war-gold transition">
              Riwayat Pesanan
            </h4>
            <p className="text-xs text-muted-foreground">Unduh invoice & QR e-ticket</p>
          </div>
        </Link>

        <Link
          href="/profile"
          className="flex items-center gap-4 rounded-2xl border border-white/8 bg-[#141413] p-5 hover:border-war-gold/40 transition group"
        >
          <div className="flex size-12 items-center justify-center rounded-xl bg-blue-500/10 text-blue-400">
            <User className="size-6" />
          </div>
          <div>
            <h4 className="font-display text-xl text-foreground group-hover:text-war-gold transition">
              Profil & NIK
            </h4>
            <p className="text-xs text-muted-foreground">Verifikasi data identitas diri</p>
          </div>
        </Link>

        <Link
          href="/elite"
          className="flex items-center gap-4 rounded-2xl border border-war-gold/30 bg-war-gold/5 p-5 hover:bg-war-gold/10 transition group"
        >
          <div className="flex size-12 items-center justify-center rounded-xl bg-war-gold text-black">
            <Crown className="size-6" />
          </div>
          <div>
            <h4 className="font-display text-xl text-war-gold-bright transition">
              Upgrade ke Elite VIP
            </h4>
            <p className="text-xs text-muted-foreground">Bypass antrean tanpa batas</p>
          </div>
        </Link>
      </section>
    </main>
  )
}
