import { ConcertGridSkeleton } from '@/components/ui/skeleton-card'
import { Navbar } from '@/components/navbar'

export default function Loading() {
  return (
    <div className="min-h-screen bg-zinc-950">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <div className="mb-8">
          <div className="h-12 w-64 bg-zinc-800 rounded-lg mb-4 relative overflow-hidden">
             <div className="absolute inset-0 bg-gradient-to-r from-transparent via-zinc-700/50 to-transparent bg-[length:200%_100%] animate-shimmer" />
          </div>
          <div className="h-5 w-96 bg-zinc-800 rounded-lg relative overflow-hidden">
             <div className="absolute inset-0 bg-gradient-to-r from-transparent via-zinc-700/50 to-transparent bg-[length:200%_100%] animate-shimmer" />
          </div>
        </div>
        
        <div className="mb-10">
          <div className="w-full h-32 bg-zinc-900 rounded-2xl border border-white/5 relative overflow-hidden">
             <div className="absolute inset-0 bg-gradient-to-r from-transparent via-zinc-800/50 to-transparent bg-[length:200%_100%] animate-shimmer" />
          </div>
        </div>

        <ConcertGridSkeleton count={6} />
      </main>
    </div>
  )
}
