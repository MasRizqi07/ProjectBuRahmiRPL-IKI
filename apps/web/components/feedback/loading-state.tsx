import { LoaderCircle } from 'lucide-react'

export function LoadingState({ label = 'Memuat data aktual…' }: { readonly label?: string }) {
  return (
    <div className="glass-panel flex min-h-48 flex-col items-center justify-center gap-4 rounded-2xl p-8 text-center" role="status" aria-live="polite">
      <LoaderCircle className="size-7 animate-spin text-war-gold" aria-hidden="true" />
      <p className="text-sm text-muted-foreground">{label}</p>
    </div>
  )
}
