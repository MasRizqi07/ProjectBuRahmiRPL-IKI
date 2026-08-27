import Link from 'next/link'
import { ArrowRight, Gauge, LockKeyhole, ShieldCheck } from 'lucide-react'
import { ConcertGrid } from '@/components/concert-grid'
import { ConcertTicker } from '@/components/concert-ticker'
import { EmptyState } from '@/components/feedback/empty-state'
import { HeroContent } from '@/components/hero-content'
import { getFeaturedConcerts } from '@/lib/queries/concerts'

const trustItems = [
  { icon: Gauge, title: 'Traffic-ready', text: 'Antrean adaptif menjaga checkout tetap responsif.' },
  { icon: ShieldCheck, title: 'Stok aktual', text: 'Inventori dikonfirmasi server sebelum pembayaran.' },
  { icon: LockKeyhole, title: 'Pembayaran aman', text: 'Transaksi diteruskan ke kanal resmi Midtrans.' },
] as const

export default async function Home() {
  const featuredConcerts = await getFeaturedConcerts()
  return (
    <main id="main-content" className="flex-1">
      <section className="hero-bg relative grid min-h-[calc(100svh-var(--header-height))] place-items-center overflow-hidden px-4 py-20 sm:px-6">
        <div className="absolute inset-0 grid-pattern opacity-35" />
        <div className="absolute inset-x-0 bottom-0 h-40 bg-linear-to-t from-background to-transparent" />
        <HeroContent />
      </section>

      {featuredConcerts.length > 0 && <ConcertTicker concerts={featuredConcerts} />}

      <section className="container-shell relative z-10 -mt-1 grid gap-4 py-12 md:grid-cols-3 md:py-16">
        {trustItems.map(({ icon: Icon, title, text }) => (
          <article key={title} className="interactive-lift glass-panel rounded-2xl p-6"><Icon className="size-6 text-war-gold" /><h2 className="mt-5 font-display text-2xl tracking-wide">{title}</h2><p className="mt-2 text-sm leading-6 text-muted-foreground">{text}</p></article>
        ))}
      </section>

      <section className="container-shell pb-16 sm:pb-24">
        <div className="mb-8 flex items-end justify-between gap-5">
          <div><p className="section-label mb-4">Trending now</p><h2 className="font-display text-4xl tracking-wide sm:text-6xl">Konser pilihan</h2><p className="mt-3 text-sm text-muted-foreground">Event dengan antusiasme tertinggi saat ini.</p></div>
          <Link href="/concerts" className="hidden items-center gap-2 text-sm font-bold text-war-gold transition hover:text-war-gold-bright sm:flex">Lihat semua <ArrowRight className="size-4" /></Link>
        </div>
        {featuredConcerts.length ? <ConcertGrid concerts={featuredConcerts.slice(0, 3)} /> : <EmptyState title="Belum ada konser pilihan" description="Event pilihan akan muncul setelah organizer mempublikasikan jadwal terbaru." action={{ href: '/concerts', label: 'Lihat seluruh konser' }} />}
        <Link href="/concerts" className="mt-6 flex min-h-12 items-center justify-center gap-2 rounded-xl border border-war-gold/25 text-sm font-bold text-war-gold sm:hidden">Lihat semua konser <ArrowRight className="size-4" /></Link>
      </section>
    </main>
  )
}
