import { CalendarDays, MapPin, QrCode, Ticket } from 'lucide-react'
import type { OrderWithDetails } from '@/lib/types/database'
import { cn } from '@/lib/utils'
import { formatIDR } from '@/lib/utils/format'

const statusLabels = { pending: 'Menunggu pembayaran', paid: 'Aktif', cancelled: 'Dibatalkan', refunded: 'Dikembalikan' } as const

export function TicketOrderCard({ order }: { readonly order: OrderWithDetails }) {
  const concert = order.concerts
  return (
    <article className="interactive-lift glass-panel overflow-hidden rounded-2xl">
      <div className="grid md:grid-cols-[1fr_auto]">
        <div className="p-5 sm:p-7">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div><p className="text-xs font-bold uppercase tracking-wider text-war-gold">{concert?.artist ?? 'War Ticket'}</p><h2 className="mt-2 font-display text-3xl tracking-wide">{concert?.title ?? 'Detail event tidak tersedia'}</h2></div>
            <span className={cn('rounded-full border px-3 py-1 text-[10px] font-bold uppercase tracking-wider', order.status === 'paid' ? 'border-status-success/30 bg-status-success/8 text-emerald-300' : order.status === 'pending' ? 'border-war-gold/30 bg-war-gold/8 text-war-gold' : 'border-white/10 bg-white/5 text-muted-foreground')}>{statusLabels[order.status]}</span>
          </div>
          <div className="mt-5 grid gap-3 text-xs text-muted-foreground sm:grid-cols-2">
            {concert?.date && <p className="flex items-center gap-2"><CalendarDays className="size-4 text-war-gold" />{new Date(concert.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>}
            {concert && <p className="flex items-center gap-2"><MapPin className="size-4 text-war-gold" />{concert.venue}, {concert.city}</p>}
            <p className="flex items-center gap-2"><Ticket className="size-4 text-war-gold" />{order.ticket_tiers?.name ?? 'Kategori tiket'} × {order.quantity}</p>
          </div>
          <div className="mt-6 flex flex-wrap items-end justify-between gap-4 border-t border-white/8 pt-5">
            <div><p className="text-[10px] uppercase tracking-wider text-muted-foreground">Total</p><p className="mt-1 font-mono font-bold text-war-gold">{formatIDR(order.total_price)}</p></div>
            <div className="min-w-0 text-left sm:text-right"><p className="text-[10px] uppercase tracking-wider text-muted-foreground">Kode tiket</p><p className="mt-1 truncate font-mono text-xs font-bold">{order.ticket_code}</p></div>
          </div>
        </div>
        <div className="grid min-h-32 place-items-center border-t border-dashed border-white/12 bg-black/20 p-6 md:w-44 md:border-l md:border-t-0"><div className="text-center"><QrCode className="mx-auto size-10 text-war-gold" /><p className="mt-3 text-[10px] uppercase tracking-wider text-muted-foreground">E-ticket</p></div></div>
      </div>
    </article>
  )
}
