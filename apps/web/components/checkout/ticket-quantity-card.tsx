import { Minus, Plus, Ticket } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { formatIDR } from '@/lib/utils/format'

interface TicketQuantityCardProps {
  readonly name: string
  readonly price: number
  readonly available: number
  readonly quantity: number
  readonly selectedCount: number
  readonly onChange: (delta: number) => void
}

export function TicketQuantityCard({ name, price, available, quantity, selectedCount, onChange }: TicketQuantityCardProps) {
  return (
    <article className="interactive-lift glass-panel rounded-2xl p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="mb-4 grid size-10 place-items-center rounded-xl bg-war-gold/10 text-war-gold"><Ticket className="size-5" /></div>
          <h3 className="font-bold text-foreground">{name}</h3>
          <p className="mt-1 font-mono text-lg font-bold text-war-gold">{formatIDR(price)}</p>
          <p className="mt-2 text-xs text-muted-foreground">{available.toLocaleString('id-ID')} tiket tersedia</p>
        </div>
        <div className="flex shrink-0 items-center gap-2 rounded-full border border-white/8 bg-black/20 p-1">
          <Button variant="ghost" size="icon-sm" className="rounded-full" onClick={() => onChange(-1)} disabled={quantity === 0} aria-label={`Kurangi ${name}`}><Minus /></Button>
          <output className="w-6 text-center font-mono text-sm font-bold">{quantity}</output>
          <Button variant="ghost" size="icon-sm" className="rounded-full" onClick={() => onChange(1)} disabled={selectedCount >= 4 || quantity >= available} aria-label={`Tambah ${name}`}><Plus /></Button>
        </div>
      </div>
    </article>
  )
}
