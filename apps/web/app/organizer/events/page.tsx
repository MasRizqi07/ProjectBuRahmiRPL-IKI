import Link from 'next/link'
import { Plus, Ticket, Calendar, MapPin, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { getConcerts } from '@/lib/queries/concerts'

export default async function OrganizerEventsPage() {
  const events = await getConcerts()

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-white/10 pb-6">
        <div>
          <span className="section-label">PROMOTOR PORTAL</span>
          <h1 className="mt-2 font-display text-4xl sm:text-5xl text-foreground">
            MANAJEMEN EVENT & INVENTORI
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            Pantau performa penjualan kuota tiket dan buat draft konser baru.
          </p>
        </div>
        <Button asChild className="rounded-xl font-bold gap-2">
          <Link href="/organizer/events/new">
            <Plus className="size-4" />
            Buat Event Baru
          </Link>
        </Button>
      </div>

      <div className="grid gap-4">
        {events.map((event) => (
          <article
            key={event.id}
            className="glass-panel flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 rounded-2xl p-6 hover:border-war-gold/40 transition"
          >
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-0.5 text-[10px] font-bold text-muted-foreground uppercase">
                  {event.category}
                </span>
                <span className="rounded-full border border-status-success/30 bg-status-success/10 px-2.5 py-0.5 text-[10px] font-bold text-status-success uppercase">
                  {event.status}
                </span>
              </div>
              <h2 className="font-display text-2xl text-foreground">{event.title}</h2>
              <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <Calendar className="size-3.5 text-war-gold" />
                  {new Date(event.date).toLocaleDateString('id-ID', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  })}
                </span>
                <span className="flex items-center gap-1.5">
                  <MapPin className="size-3.5 text-war-gold" />
                  {event.venue}, {event.city}
                </span>
                <span className="flex items-center gap-1.5">
                  <Ticket className="size-3.5 text-war-gold" />
                  {event.ticket_tiers?.length ?? 0} Tier Kategori
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              <Button asChild variant="outline" size="sm" className="rounded-xl border-white/10">
                <Link href={`/concerts/${event.id}`}>
                  Lihat Public <ArrowRight className="size-3.5 ml-1" />
                </Link>
              </Button>
            </div>
          </article>
        ))}
      </div>
    </div>
  )
}

