import { Clock3, ShieldCheck, Users } from 'lucide-react'

interface QueueStatusView {
  readonly entryId: string
  readonly position: number | null
  readonly estimatedWaitSeconds: number | null
}

function formatDuration(seconds: number | null): string {
  if (seconds === null) return 'Menghitung…'
  const minutes = Math.floor(seconds / 60)
  return `${String(minutes).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`
}

export function QueueStatusCard({ queue }: { readonly queue: QueueStatusView }) {
  return (
    <div className="space-y-4" aria-live="polite">
      <section className="glass-panel relative overflow-hidden rounded-3xl p-7 text-center sm:p-10">
        <div className="absolute inset-0 grid-pattern opacity-30" />
        <div className="relative">
          <div className="mx-auto mb-5 grid size-12 place-items-center rounded-full border border-war-gold/30 bg-war-gold/10 text-war-gold"><Users /></div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-muted-foreground">Posisi antrean</p>
          <p className="mt-3 break-all font-display text-[clamp(3.75rem,20vw,8rem)] leading-none tracking-wide text-foreground">{queue.position === null ? '—' : queue.position.toLocaleString('id-ID')}</p>
          <p className="mt-4 font-mono text-xs text-muted-foreground">ID {queue.entryId.slice(0, 8).toUpperCase()}</p>
        </div>
      </section>
      <section className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-war-gold/20 bg-war-gold/8 p-5"><Clock3 className="mb-4 size-5 text-war-gold" /><p className="text-xs text-muted-foreground">Perkiraan waktu</p><p className="mt-1 font-mono text-2xl font-bold text-war-gold">{formatDuration(queue.estimatedWaitSeconds)}</p></div>
        <div className="rounded-2xl border border-status-success/20 bg-status-success/8 p-5"><ShieldCheck className="mb-4 size-5 text-status-success" /><p className="text-xs text-muted-foreground">Status posisi</p><p className="mt-1 text-sm font-bold text-emerald-100">Tersimpan aman</p></div>
      </section>
    </div>
  )
}
