import { ShieldCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { formatIDR } from '@/lib/utils/format'

interface SelectionSummaryProps {
  readonly selectedCount: number
  readonly subtotal: number
  readonly submitting: boolean
  readonly onReserve: () => void
}

export function SelectionSummary({ selectedCount, subtotal, submitting, onReserve }: SelectionSummaryProps) {
  return (
    <aside className="glass-panel h-fit rounded-2xl p-5 lg:sticky lg:top-24 sm:p-6">
      <p className="section-label mb-4">Ringkasan</p>
      <h2 className="font-display text-3xl tracking-wide">Pilihan Anda</h2>
      <div className="my-6 flex items-end justify-between gap-4 border-y border-white/8 py-5">
        <span className="text-sm text-muted-foreground">{selectedCount} tiket</span>
        <span className="font-mono text-xl font-bold text-war-gold">{formatIDR(subtotal)}</span>
      </div>
      <div className="mb-5 flex items-start gap-3 text-xs leading-5 text-muted-foreground"><ShieldCheck className="mt-0.5 size-4 shrink-0 text-status-success" />Harga dan ketersediaan dikonfirmasi ulang oleh server saat reservasi.</div>
      <Button onClick={onReserve} disabled={selectedCount === 0 || submitting} size="lg" className="h-12 w-full rounded-xl font-bold">{submitting ? 'Mengamankan tiket…' : 'Amankan tiket'}</Button>
    </aside>
  )
}
