import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'

const steps = ['Antrean', 'Pilih tiket', 'Pembayaran', 'Selesai'] as const

export function CheckoutProgress({ current }: { readonly current: 1 | 2 | 3 | 4 }) {
  return (
    <ol className="mb-8 grid grid-cols-4 gap-1" aria-label="Tahapan pembelian">
      {steps.map((label, index) => {
        const step = index + 1
        const complete = step < current
        const active = step === current
        return (
          <li key={label} className="min-w-0">
            <div className={cn('mb-2 h-1 rounded-full', step <= current ? 'bg-war-gold' : 'bg-white/8')} />
            <div className={cn('flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider sm:text-xs', active ? 'text-war-gold' : complete ? 'text-foreground' : 'text-muted-foreground')}>
              <span className={cn('grid size-5 shrink-0 place-items-center rounded-full border text-[10px]', step <= current ? 'border-war-gold bg-war-gold/10' : 'border-border')}>
                {complete ? <Check className="size-3" /> : step}
              </span>
              <span className="hidden truncate min-[420px]:block">{label}</span>
            </div>
          </li>
        )
      })}
    </ol>
  )
}
