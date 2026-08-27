import Image from 'next/image'
import { CalendarDays, MapPin } from 'lucide-react'
import { CountdownTimer } from '@/components/countdown-timer'

interface ConcertHeroProps {
  readonly title: string
  readonly artist: string
  readonly category: string
  readonly imageUrl: string | null
  readonly date: string
  readonly venue: string
  readonly city: string
}

export function ConcertHero({ title, artist, category, imageUrl, date, venue, city }: ConcertHeroProps) {
  return (
    <section className="relative min-h-[620px] overflow-hidden">
      <Image src={imageUrl || '/placeholder.jpg'} alt={`Poster ${artist} — ${title}`} fill sizes="100vw" className="object-cover" priority />
      <div className="absolute inset-0 bg-linear-to-t from-background via-background/70 to-black/25" />
      <div className="absolute inset-0 grid-pattern opacity-20" />
      <div className="container-shell relative flex min-h-[620px] items-end py-12 sm:py-16">
        <div className="grid w-full items-end gap-8 lg:grid-cols-[minmax(0,1fr)_auto]">
          <div className="max-w-4xl animate-fade-up">
            <span className="rounded-full border border-war-gold/30 bg-war-gold/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-war-gold backdrop-blur-md">{category}</span>
            <h1 className="mt-5 break-words font-display text-5xl leading-[0.88] tracking-wide min-[390px]:text-6xl sm:text-8xl lg:text-9xl">{title}</h1>
            <p className="mt-4 text-xl font-bold text-foreground/85 sm:text-2xl">{artist}</p>
            <div className="mt-6 flex flex-col gap-3 text-sm text-muted-foreground sm:flex-row sm:gap-6">
              <span className="flex items-center gap-2"><CalendarDays className="size-4 text-war-gold" />{new Date(date).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</span>
              <span className="flex items-center gap-2"><MapPin className="size-4 text-war-gold" />{venue}, {city}</span>
            </div>
          </div>
          <div className="glass-panel overflow-x-auto rounded-2xl p-4 sm:p-5"><p className="mb-3 text-xs font-bold uppercase tracking-wider text-muted-foreground">Penjualan berakhir dalam</p><CountdownTimer targetDate={date} /></div>
        </div>
      </div>
    </section>
  )
}
