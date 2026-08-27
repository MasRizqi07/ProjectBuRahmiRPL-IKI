import { CalendarDays, Info, MapPin, Users } from 'lucide-react'

interface EventInfoCardProps {
  readonly date: string
  readonly venue: string
  readonly city: string
  readonly sold: number
  readonly capacity: number
  readonly description: string | null
}

export function EventInfoCard({ date, venue, city, sold, capacity, description }: EventInfoCardProps) {
  const details = [
    { icon: CalendarDays, label: 'Tanggal dan waktu', value: new Date(date).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }), secondary: `${new Date(date).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB` },
    { icon: MapPin, label: 'Lokasi', value: venue, secondary: city },
    { icon: Users, label: 'Ketersediaan', value: `${sold.toLocaleString('id-ID')} / ${capacity.toLocaleString('id-ID')} tiket`, secondary: 'Diperbarui dari inventori event' },
  ]
  return (
    <aside className="glass-panel rounded-2xl p-6 lg:sticky lg:top-24">
      <p className="section-label mb-4">Informasi</p>
      <h2 className="font-display text-3xl tracking-wide">Detail acara</h2>
      <div className="mt-6 space-y-6">
        {details.map(({ icon: Icon, label, value, secondary }) => (
          <div key={label} className="flex gap-4"><div className="grid size-10 shrink-0 place-items-center rounded-xl bg-war-gold/10 text-war-gold"><Icon className="size-5" /></div><div><p className="text-xs text-muted-foreground">{label}</p><p className="mt-1 text-sm font-bold">{value}</p><p className="mt-1 text-xs text-muted-foreground">{secondary}</p></div></div>
        ))}
      </div>
      <div className="mt-7 border-t border-white/8 pt-6"><div className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-war-gold"><Info className="size-4" /> Catatan event</div><p className="text-sm leading-6 text-muted-foreground">{description || 'Detail tambahan akan diumumkan oleh organizer melalui kanal resmi event.'}</p></div>
    </aside>
  )
}
