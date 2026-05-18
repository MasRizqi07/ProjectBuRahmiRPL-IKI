import { getConcertById } from '@/lib/concerts'
import { TicketTierCard } from '@/components/ticket-tier-card'
import { Navbar } from '@/components/navbar'
import { notFound } from 'next/navigation'
import Image from 'next/image'

interface ConcertDetailPageProps {
  params: { id: string }
}

export default function ConcertDetailPage({ params }: ConcertDetailPageProps) {
  const { id } = params
  const concert = getConcertById(id)

  if (!concert) {
    return notFound()
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero Image Section */}
      <section className="relative h-[45vh] sm:h-[60vh] min-h-[400px] w-full overflow-hidden">
        <Image
          src={concert.image || '/images/placeholder.jpg'}
          alt={concert.title}
          fill
          sizes="100vw"
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/60 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-b from-zinc-950/40 via-transparent to-transparent" />
        
        <div className="absolute inset-0 flex flex-col items-center justify-end pb-12 sm:pb-16 px-4 text-center z-10 animate-fade-up">
          <h1 className="text-4xl sm:text-5xl md:text-7xl font-black text-foreground mb-4 sm:mb-6 max-w-4xl tracking-tight">{concert.title}</h1>
          <p className="text-base sm:text-lg md:text-xl text-zinc-300 font-medium">{concert.artist} • {concert.city}</p>
          <p className="text-base sm:text-lg md:text-xl text-amber-400 font-bold mt-2">
            {concert.date} • {concert.time}
          </p>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-12">
          <h2 className="text-3xl font-black text-foreground mb-2">Pilih Kategori Tiket</h2>
          <p className="text-muted-foreground">Berikan informasi lebih lengkap untuk memproses pesanan Anda</p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mb-16">
          {concert.ticketTiers.map((tier) => (
            <TicketTierCard key={tier.id} tier={tier} concertId={concert.id} />
          ))}
        </div>

        {/* Concert Info Card */}
        <div className="border border-zinc-700/50 rounded-2xl p-8 bg-zinc-900/50">
          <h3 className="text-xl font-bold text-foreground mb-4">Informasi Konser</h3>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Artis</p>
              <p className="text-lg font-semibold text-foreground">{concert.artist}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">Tanggal</p>
              <p className="text-lg font-semibold text-foreground">{concert.date}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">Lokasi</p>
              <p className="text-lg font-semibold text-foreground">{concert.venue}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">Total Tiket</p>
              <p className="text-lg font-semibold text-foreground">
                {(concert.ticketsSold ?? 0).toLocaleString('id-ID')} / {(concert.totalTickets ?? 0).toLocaleString('id-ID')}
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
