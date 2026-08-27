import type { SalesInventoryResponse } from '@war-ticket/contracts'
import { cn } from '@/lib/utils'
import { formatIDR } from '@/lib/utils/format'

interface SeatMapProps {
  readonly seats: SalesInventoryResponse['seats']
  readonly selectedSeats: ReadonlySet<string>
  readonly selectedCount: number
  readonly onToggle: (seatId: string) => void
}

export function SeatMap({ seats, selectedSeats, selectedCount, onToggle }: SeatMapProps) {
  if (seats.length === 0) return <p className="rounded-xl border border-dashed border-white/10 p-6 text-sm text-muted-foreground">Event ini tidak menyediakan kursi bernomor.</p>
  return (
    <div className="glass-panel rounded-2xl p-4 sm:p-6">
      <div className="mx-auto mb-8 max-w-lg rounded-t-[50%] border-t-4 border-war-gold/70 bg-war-gold/8 py-3 text-center text-[10px] font-bold uppercase tracking-[0.35em] text-war-gold">Panggung</div>
      <div className="grid grid-cols-4 gap-2 min-[420px]:grid-cols-6 sm:grid-cols-8">
        {seats.map((seat) => {
          const selected = selectedSeats.has(seat.id)
          return (
            <button
              key={seat.id}
              type="button"
              disabled={!seat.available || (selectedCount >= 4 && !selected)}
              onClick={() => onToggle(seat.id)}
              aria-pressed={selected}
              aria-label={`${seat.section}, kursi ${seat.row}-${seat.number}, ${formatIDR(seat.price)}`}
              className={cn('min-h-10 overflow-hidden rounded-lg border px-1 py-2 text-[11px] font-bold transition focus-visible:ring-2 focus-visible:ring-war-gold', selected ? 'border-war-gold bg-war-gold text-primary-foreground shadow-[0_0_18px_rgb(240_180_41/25%)]' : seat.available ? 'border-white/10 bg-white/5 text-foreground hover:border-war-gold/60' : 'cursor-not-allowed border-white/5 bg-black/20 text-muted-foreground/30')}
            >
              {seat.row}-{seat.number}
            </button>
          )
        })}
      </div>
      <div className="mt-6 flex flex-wrap gap-4 text-xs text-muted-foreground">
        {[['bg-white/5', 'Tersedia'], ['bg-war-gold', 'Dipilih'], ['bg-black/30', 'Tidak tersedia']].map(([color, label]) => <span key={label} className="flex items-center gap-2"><span className={`size-3 rounded-sm border border-white/10 ${color}`} />{label}</span>)}
      </div>
    </div>
  )
}
