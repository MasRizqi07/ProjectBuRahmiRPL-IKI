import { Navbar } from '@/components/navbar'

export default function Loading() {
  return (
    <div className="min-h-screen bg-zinc-950 pb-24 md:pb-0">
      <Navbar />

      {/* Hero Section Skeleton */}
      <section className="relative h-[60vh] md:h-[70vh] w-full bg-zinc-900 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-zinc-900 via-zinc-800 to-zinc-900 bg-[length:200%_100%] animate-shimmer" />
        <div className="absolute inset-0 flex flex-col justify-end pb-12 px-4 md:px-8 max-w-7xl mx-auto w-full z-10">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
            <div className="w-full md:w-2/3">
              <div className="h-6 w-24 bg-zinc-700 rounded-full mb-4" />
              <div className="h-16 md:h-24 w-3/4 bg-zinc-700 rounded-xl mb-4" />
              <div className="h-8 w-1/2 bg-zinc-700 rounded-lg" />
            </div>
            <div className="w-full md:w-72 h-32 bg-zinc-800 rounded-2xl" />
          </div>
        </div>
      </section>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 flex flex-col lg:flex-row gap-12">
        <div className="flex-1 space-y-8">
          <div className="h-10 w-64 bg-zinc-800 rounded-lg" />
          <div className="grid sm:grid-cols-2 gap-6">
            <div className="h-64 bg-zinc-900 rounded-2xl" />
            <div className="h-64 bg-zinc-900 rounded-2xl" />
          </div>
        </div>
        <aside className="lg:w-[380px] shrink-0">
          <div className="h-[400px] bg-zinc-900 rounded-2xl" />
        </aside>
      </main>
    </div>
  )
}
