import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowDown } from 'lucide-react'
import { ConcertHero } from '@/components/concerts/concert-hero'
import { SubscribeButton } from '@/components/concerts/subscribe-button'
import { EventInfoCard } from '@/components/concerts/event-info-card'
import { EmptyState } from '@/components/feedback/empty-state'
import { TicketTierCard } from '@/components/ticket-tier-card'
import { Button } from '@/components/ui/button'
import { getConcertById } from '@/lib/queries/concerts'
import { formatIDR } from '@/lib/utils/format'

interface Props { readonly params: Promise<{ id: string }> }

export async function generateMetadata({ params }: Props) {
  const concert = await getConcertById((await params).id)
  if (!concert) return { title: 'Konser Tidak Ditemukan' }
  return {
    title: `${concert.title} — WAR TICKET`,
    description: concert.description,
    ...(concert.image_url ? { openGraph: { images: [concert.image_url] } } : {}),
  }
}

export default async function ConcertDetailPage({ params }: Props) {
  const concert = await getConcertById((await params).id)
  if (!concert) notFound()

  const tiers = concert.ticket_tiers ?? []
  const sold = tiers.reduce((total, tier) => total + tier.sold, 0)
  const capacity = tiers.reduce((total, tier) => total + tier.capacity, 0)
  const available = tiers.filter((tier) => tier.capacity > tier.sold)
  const lowestPrice = available.length ? Math.min(...available.map((tier) => tier.price)) : tiers.length ? Math.min(...tiers.map((tier) => tier.price)) : 0

  return (
    <main id="main-content" className="flex-1 pb-20 md:pb-0">
      <ConcertHero title={concert.title} artist={concert.artist} category={concert.category} imageUrl={concert.image_url} date={concert.date} venue={concert.venue} city={concert.city} />
      <section id="tickets" className="container-shell grid gap-10 py-12 lg:grid-cols-[minmax(0,1fr)_360px] lg:py-16">
        <div>
          <p className="section-label mb-4">Inventori aktual</p>
          <h2 className="font-display text-4xl tracking-wide sm:text-5xl">Pilih kategori tiket</h2>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">Setiap pembelian akan melalui antrean dan reservasi server-side sebelum pembayaran.</p>
          <div className="mt-5"><SubscribeButton eventId={concert.id} /></div>
          <div className="mt-8">{tiers.length ? <div className="grid gap-5 sm:grid-cols-2">{tiers.map((tier) => <TicketTierCard key={tier.id} tier={tier} concertId={concert.id} />)}</div> : <EmptyState title="Tiket belum tersedia" description="Organizer belum membuka inventori tiket untuk event ini." />}</div>
        </div>
        <EventInfoCard date={concert.date} venue={concert.venue} city={concert.city} sold={sold} capacity={capacity} description={concert.description} />
      </section>
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-white/10 bg-background/92 p-3 backdrop-blur-xl md:hidden">
        <div className="container-shell flex items-center justify-between gap-4 px-0">
          <div><p className="text-[10px] uppercase tracking-wider text-muted-foreground">Mulai dari</p><p className="font-mono text-sm font-bold text-war-gold">{formatIDR(lowestPrice)}</p></div>
          <Button asChild className="rounded-xl font-bold"><Link href="#tickets">Pilih tiket <ArrowDown /></Link></Button>
        </div>
      </div>
    </main>
  )
}
