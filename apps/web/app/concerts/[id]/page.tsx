import { getConcertById } from '@/lib/queries/concerts'
import { TicketTierCard } from '@/components/ticket-tier-card'
import { Navbar } from '@/components/navbar'
import { notFound } from 'next/navigation'
import Image from 'next/image'
import { formatIDR } from '@/lib/utils/format'
import { CountdownTimer } from '@/components/countdown-timer'
import { MapPin, Calendar, Users, Info } from 'lucide-react'
import Link from 'next/link'

interface Props {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: Props) {
  const { id } = await params
  const concert = await getConcertById(id)
  if (!concert) return { title: 'Konser Tidak Ditemukan' }

  return {
    title: `${concert.title} — WAR TICKET`,
    description: concert.description,
    openGraph: {
      images: [concert.image_url ?? ''],
    }
  }
}

export default async function ConcertDetailPage({ params }: Props) {
  const { id } = await params
  const concert = await getConcertById(id)

  if (!concert) {
    return notFound()
  }

  const tiers = concert.ticket_tiers || []
  const ticketsSold = tiers.reduce((acc, tier) => acc + tier.sold, 0)
  const totalTickets = tiers.reduce((acc, tier) => acc + tier.capacity, 0)
  
  const availableTiers = tiers.filter(t => t.capacity - t.sold > 0)
  const lowestPrice = availableTiers.length > 0 
    ? Math.min(...availableTiers.map(t => t.price)) 
    : (tiers.length > 0 ? Math.min(...tiers.map(t => t.price)) : 0)

  return (
    <div className="min-h-screen bg-zinc-950 pb-24 md:pb-0">
      <Navbar />

      {/* Hero Section */}
      <section className="relative h-[60vh] md:h-[70vh] w-full overflow-hidden">
        <div className="absolute inset-0">
          <Image
            src={concert.image_url || '/images/placeholder.jpg'}
            alt={`Poster konser ${concert.artist} - ${concert.title}`}
            fill
            sizes="100vw"
            className="object-cover"
            priority
          />
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/60 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-b from-zinc-950/40 via-transparent to-transparent" />
        
        <div className="absolute inset-0 flex flex-col justify-end pb-12 px-4 md:px-8 max-w-7xl mx-auto w-full z-10">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
            <div className="animate-fade-up">
              <span className="inline-block px-3 py-1 bg-white/10 backdrop-blur-md border border-white/20 rounded-full text-white/90 text-xs font-semibold uppercase tracking-wider mb-4">
                {concert.category}
              </span>
              <h1 className="font-display text-5xl md:text-7xl font-black text-white mb-2 tracking-tight leading-tight">
                {concert.title}
              </h1>
              <p className="font-body text-xl md:text-2xl text-white/80 font-medium">
                {concert.artist}
              </p>
            </div>
            
            <div className="bg-zinc-900/60 backdrop-blur-md border border-white/10 p-5 rounded-2xl animate-fade-up shrink-0">
              <p className="font-body text-xs font-bold text-white/50 uppercase tracking-widest mb-3">Waktu Tersisa</p>
              <CountdownTimer targetDate={concert.date} />
            </div>
          </div>
        </div>
      </section>

      <main id="tickets" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 flex flex-col lg:flex-row gap-12">
        {/* Main Content - Tickets */}
        <div className="flex-1">
          <div className="mb-8">
            <h2 className="font-display text-3xl font-black text-white mb-2">Pilih Kategori Tiket</h2>
            <p className="font-body text-zinc-400">Pilih kategori tiket yang paling sesuai dengan preferensimu.</p>
          </div>

          <div className="grid sm:grid-cols-2 gap-6 mb-12">
            {tiers.map((tier) => (
              <TicketTierCard key={tier.id} tier={tier} concertId={concert.id} />
            ))}
          </div>
        </div>

        {/* Sidebar - Event Info */}
        <aside className="lg:w-[380px] shrink-0 space-y-6">
          <div className="bg-zinc-900/50 border border-white/5 rounded-2xl p-6 relative overflow-hidden">
            {/* Map Placeholder */}
            <div className="w-full h-40 bg-zinc-800 rounded-xl mb-6 flex items-center justify-center border border-white/5 relative overflow-hidden">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(168,85,247,0.25),transparent_65%)] opacity-70" />
              <MapPin className="text-white/20" size={48} />
              <div className="absolute bottom-3 left-3 bg-zinc-950/80 px-3 py-1.5 rounded-lg border border-white/10 backdrop-blur-md">
                <span className="text-xs font-semibold text-white/70">Lihat Peta</span>
              </div>
            </div>

            <h3 className="font-display text-xl font-bold text-white mb-6">Informasi Acara</h3>
            
            <div className="space-y-6">
              <div className="flex gap-4">
                <div className="w-10 h-10 rounded-full bg-violet-500/20 flex items-center justify-center shrink-0">
                  <Calendar className="text-violet-400" size={20} />
                </div>
                <div>
                  <p className="font-body text-sm text-zinc-500 mb-1">Tanggal & Waktu</p>
                  <p className="font-body font-semibold text-white">
                    {new Date(concert.date).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                  </p>
                  <p className="font-body text-sm text-white/60">
                    {new Date(concert.date).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center shrink-0">
                  <MapPin className="text-amber-400" size={20} />
                </div>
                <div>
                  <p className="font-body text-sm text-zinc-500 mb-1">Lokasi</p>
                  <p className="font-body font-semibold text-white">{concert.venue}</p>
                  <p className="font-body text-sm text-white/60">{concert.city}</p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center shrink-0">
                  <Users className="text-emerald-400" size={20} />
                </div>
                <div>
                  <p className="font-body text-sm text-zinc-500 mb-1">Ketersediaan</p>
                  <p className="font-body font-semibold text-white">
                    {ticketsSold.toLocaleString('id-ID')} / {totalTickets.toLocaleString('id-ID')} Tiket
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center shrink-0">
                  <Info className="text-blue-400" size={20} />
                </div>
                <div>
                  <p className="font-body text-sm text-zinc-500 mb-1">Informasi Tambahan</p>
                  <p className="font-body text-sm text-white/80">
                    {concert.description || 'Harap menukar e-ticket dengan gelang fisik H-1 atau pada hari H acara. Dress code: Kasual.'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </aside>
      </main>

      {/* Sticky Mobile CTA */}
      <div className="fixed bottom-0 inset-x-0 z-50 md:hidden">
        <div className="bg-zinc-950/90 backdrop-blur-xl border-t border-white/10 p-4 flex items-center justify-between shadow-[0_-10px_40px_rgba(0,0,0,0.5)]">
          <div>
            <p className="font-body text-xs text-white/50 mb-0.5">Mulai dari</p>
            <p className="font-mono text-lg font-bold text-white leading-none">{formatIDR(lowestPrice)}</p>
          </div>
          <Link href="#tickets">
            <button className="bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 text-white font-bold py-3 px-8 rounded-full shadow-lg shadow-violet-500/25 transition-all active:scale-95">
              Beli Tiket
            </button>
          </Link>
        </div>
      </div>
    </div>
  )
}
