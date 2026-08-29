import Link from 'next/link'
import {
  ArrowRight,
  Crown,
  Flame,
  Gauge,
  LockKeyhole,
  ShieldCheck,
} from 'lucide-react'
import { ConcertGrid } from '@/components/concert-grid'
import { ConcertTicker } from '@/components/concert-ticker'
import { HeroContent } from '@/components/hero-content'
import { StatsBar } from '@/components/stats-bar'
import { DesignBackdrop } from '@/components/ui/design-backdrop'
import { getFeaturedConcerts } from '@/lib/queries/concerts'

const statsData = [
  { value: 'GA + Seat', label: 'Model Tiket', sublabel: 'General admission dan kursi bernomor' },
  { value: 'FIFO', label: 'Antrean Adil', sublabel: 'Randomisasi pre-queue lalu first-in-first-out' },
  { value: '15 Menit', label: 'Stock Hold', sublabel: 'Reservasi sementara selama checkout' },
  { value: 'QR Dinamis', label: 'Validasi Tiket', sublabel: 'Token singkat dengan proteksi replay' },
]

const features = [
  {
    icon: Gauge,
    title: 'Antrean Per Sesi Penjualan',
    description: 'Pre-queue diacak sekali, lalu peserta diproses FIFO dengan admission token yang dibatasi waktu.',
  },
  {
    icon: ShieldCheck,
    title: 'Kontrol Akses Berlapis',
    description: 'Rate limit, idempotency key, otorisasi berbasis peran, dan audit trail melindungi operasi sensitif.',
  },
  {
    icon: LockKeyhole,
    title: 'Real-time Stock Hold',
    description: 'Stok tiket di-hold secara server-side selama 15 menit ketika reservasi berhasil dibuat.',
  },
]

export default async function Home() {
  const featuredConcerts = await getFeaturedConcerts()

  return (
    <main id="main-content" tabIndex={-1} className="flex-1 overflow-x-hidden">
      {/* Hero Section with Glowing Atmosphere */}
      <section className="hero-bg relative grid min-h-[calc(100svh-var(--header-height))] place-items-center overflow-hidden px-4 py-20 sm:px-6">
        <DesignBackdrop group="war_ticket_landing_page" index={0} priority imageClassName="opacity-55" overlayClassName="bg-linear-to-b from-black/55 via-black/70 to-background" />
        <div className="absolute inset-0 grid-pattern opacity-30 pointer-events-none" />
        <div className="absolute inset-x-0 bottom-0 h-40 bg-linear-to-t from-background to-transparent pointer-events-none" />
        <HeroContent />
      </section>

      {/* Live Concerts Marquee Ticker */}
      {featuredConcerts.length > 0 && <ConcertTicker concerts={featuredConcerts} />}

      {/* Real-time Platform Statistics */}
      <StatsBar />

      {/* Key Stats Bar */}
      <section className="border-y border-white/8 bg-[#111110]/60 py-10 backdrop-blur-xl">
        <div className="container-shell grid grid-cols-2 gap-6 md:grid-cols-4">
          {statsData.map((stat, idx) => (
            <div
              key={stat.label}
              className={`flex flex-col items-center justify-center text-center ${
                idx !== statsData.length - 1 ? 'md:border-r md:border-white/10' : ''
              }`}
            >
              <p className="font-display text-4xl sm:text-5xl font-bold tracking-wide text-war-gold">
                {stat.value}
              </p>
              <p className="mt-1 text-sm font-bold text-foreground">{stat.label}</p>
              <p className="text-[11px] text-muted-foreground">{stat.sublabel}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Trending Concerts & War Drops */}
      <section className="container-shell py-16 sm:py-24">
        <div className="mb-10 flex flex-col items-start justify-between gap-4 md:flex-row md:items-end">
          <div>
            <div className="flex items-center gap-2">
              <span className="section-label">LIVE TICKETING</span>
              <span className="inline-flex items-center gap-1 rounded-full border border-orange-500/30 bg-orange-500/10 px-2.5 py-0.5 text-[10px] font-bold text-orange-400">
                <Flame className="size-3" /> WAR SEDANG BERLANGSUNG
              </span>
            </div>
            <h2 className="mt-2 font-display text-4xl sm:text-6xl tracking-wide text-foreground">
              KONSER PILIHAN & WAR AKTIF
            </h2>
            <p className="mt-2 text-xs sm:text-sm text-muted-foreground max-w-xl">
              Pilih konser idamanmu, pantau indikator ketersediaan, dan amankan kursi sebelum kuota habis.
            </p>
          </div>
          <Link
            href="/concerts"
            className="flex items-center gap-2 rounded-xl border border-war-gold/30 bg-war-gold/10 px-5 py-2.5 text-xs font-bold text-war-gold-bright hover:bg-war-gold/20 transition"
          >
            Lihat Semua Konser <ArrowRight className="size-4" />
          </Link>
        </div>

        {/* Featured Concerts Grid */}
        <ConcertGrid concerts={featuredConcerts} />
      </section>

      {/* High-Stakes War Engine Features */}
      <section className="border-t border-white/8 bg-gradient-to-b from-[#121211] to-[#090909] py-16 sm:py-24">
        <div className="container-shell">
          <div className="mx-auto max-w-2xl text-center">
            <span className="section-label">INFRASTRUKTUR GENERASI TERBARU</span>
            <h2 className="mt-2 font-display text-4xl sm:text-5xl tracking-wide text-foreground">
              Kenapa Memilih War Ticket?
            </h2>
            <p className="mt-3 text-xs sm:text-sm text-muted-foreground">
              Didesain untuk menjaga fairness antrean dan konsistensi stok saat trafik penjualan meningkat.
            </p>
          </div>

          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {features.map((feat) => {
              const Icon = feat.icon
              return (
                <div
                  key={feat.title}
                  className="interactive-lift rounded-2xl border border-white/10 bg-[#161615]/80 p-8 backdrop-blur-xl relative overflow-hidden group"
                >
                  <div className="absolute -top-10 -right-10 size-32 rounded-full bg-war-gold/5 blur-2xl group-hover:bg-war-gold/15 transition-all" />
                  <div className="flex size-12 items-center justify-center rounded-xl border border-war-gold/30 bg-war-gold/10 text-war-gold shadow-[0_0_15px_rgba(240,180,41,0.2)]">
                    <Icon className="size-6" />
                  </div>
                  <h3 className="mt-6 font-display text-2xl tracking-wide text-foreground">
                    {feat.title}
                  </h3>
                  <p className="mt-2 text-xs sm:text-sm leading-relaxed text-muted-foreground">
                    {feat.description}
                  </p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Elite VIP Program Banner */}
      <section className="container-shell py-12 sm:py-16">
        <div className="relative overflow-hidden rounded-3xl border border-war-gold/30 bg-linear-to-r from-[#1f1a0d] via-[#161514] to-[#0d0d0c] p-8 sm:p-12 shadow-[0_20px_60px_rgba(0,0,0,0.6)]">
          <DesignBackdrop group="war_ticket_elite_membership_program" index={0} imageClassName="opacity-30" overlayClassName="bg-linear-to-r from-black/95 via-black/80 to-black/60" />
          <div className="absolute -right-20 -top-20 size-80 rounded-full bg-war-gold/15 blur-3xl pointer-events-none" />
          
          <div className="relative z-10 flex flex-col items-start justify-between gap-8 lg:flex-row lg:items-center">
            <div className="max-w-2xl">
              <div className="flex items-center gap-2">
                <Crown className="size-5 text-war-gold" />
                <span className="text-xs font-black uppercase tracking-widest text-war-gold">
                  WAR TICKET ELITE & VANGUARD LOUNGE
                </span>
              </div>
              <h3 className="mt-3 font-display text-3xl sm:text-5xl tracking-wide text-foreground">
                Akses Presale Elite dengan Kuota Terpisah
              </h3>
              <p className="mt-2 text-xs sm:text-sm text-muted-foreground leading-relaxed">
                Dapatkan akses ke sesi presale berkuota terpisah, concierge khusus, dan Vanguard Lounge tanpa memotong antrean penjualan reguler.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto shrink-0">
              <Link
                href="/elite"
                className="flex items-center justify-center gap-2 rounded-xl bg-primary px-8 py-4 text-xs font-bold text-primary-foreground transition hover:bg-war-gold-bright shadow-[0_0_20px_rgba(240,180,41,0.3)]"
              >
                <Crown className="size-4" /> Gabung Elite Member
              </Link>
              <Link
                href="/elite/lounge"
                className="flex items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/5 px-6 py-4 text-xs font-bold text-foreground transition hover:border-war-gold/40 hover:bg-white/10"
              >
                Masuk Vanguard Lounge
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}
