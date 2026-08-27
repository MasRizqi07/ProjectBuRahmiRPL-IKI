import type { ReservationDetailResponse } from '@war-ticket/contracts'
import { Clock3 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatIDR } from '@/lib/utils/format'

function formatDuration(seconds: number): string {
  return `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`
}

export function PaymentSummary({ reservation, seconds }: { readonly reservation: ReservationDetailResponse; readonly seconds: number }) {
  const urgent = seconds < 120
  return (
    <aside className="h-fit space-y-4 lg:sticky lg:top-24">
      <div className={cn('rounded-2xl border p-5 text-center', urgent ? 'border-destructive/30 bg-destructive/8 text-red-200' : 'border-war-gold/25 bg-war-gold/8 text-war-gold-bright')}>
        <div className="mb-2 flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-wider"><Clock3 className="size-4" /> Hold berakhir dalam</div>
        <p className="font-mono text-4xl font-bold tabular-nums" aria-live="polite">{formatDuration(seconds)}</p>
      </div>
      <section className="glass-panel rounded-2xl p-5 sm:p-6">
        <p className="section-label mb-3">Pesanan</p>
        <h2 className="font-display text-3xl tracking-wide">{reservation.eventTitle}</h2>
        <div className="my-5 space-y-3 border-y border-white/8 py-5">
          {reservation.items.map((item, index) => (
            <div key={`${item.label}-${index}`} className="flex justify-between gap-4 text-sm"><span className="text-muted-foreground">{item.label} × {item.quantity}</span><span>{formatIDR(item.unitPrice * item.quantity)}</span></div>
          ))}
        </div>
        <dl className="space-y-2 text-sm">
          <div className="flex justify-between text-muted-foreground"><dt>Subtotal</dt><dd>{formatIDR(reservation.subtotal)}</dd></div>
          <div className="flex justify-between text-muted-foreground"><dt>Service fee</dt><dd>{formatIDR(reservation.serviceFee)}</dd></div>
          <div className="mt-3 flex justify-between border-t border-white/8 pt-4 text-lg font-bold"><dt>Total</dt><dd className="font-mono text-war-gold">{formatIDR(reservation.total)}</dd></div>
        </dl>
      </section>
    </aside>
  )
}
