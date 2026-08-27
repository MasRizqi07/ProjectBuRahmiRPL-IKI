import { ConcertGridSkeleton } from '@/components/ui/skeleton-card'

export default function Loading() {
  return (
    <main id="main-content" className="container-shell flex-1 py-10 sm:py-14" aria-busy="true">
      <div className="mb-8 space-y-3"><div className="h-4 w-32 animate-pulse rounded bg-war-gold/20" /><div className="h-14 max-w-xl animate-pulse rounded-xl bg-white/8" /><div className="h-5 max-w-md animate-pulse rounded bg-white/6" /></div>
      <div className="mb-8 h-48 animate-pulse rounded-2xl border border-white/8 bg-white/4" />
      <ConcertGridSkeleton count={6} />
    </main>
  )
}
