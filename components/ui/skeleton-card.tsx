export function ConcertCardSkeleton() {
  return (
    <div className="rounded-xl overflow-hidden aspect-[3/4] sm:aspect-[4/3] bg-zinc-900 border border-white/5 relative">
      <div className="absolute inset-0 bg-gradient-to-r from-zinc-900 via-zinc-800 to-zinc-900 bg-[length:200%_100%] animate-shimmer" />
      <div className="absolute bottom-0 inset-x-0 p-5 z-20 flex flex-col">
        <div className="h-8 bg-zinc-800 rounded-md w-3/4 mb-4 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-zinc-700/50 to-transparent bg-[length:200%_100%] animate-shimmer" />
        </div>
        <div className="h-4 bg-zinc-800 rounded-md w-1/2 mb-6 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-zinc-700/50 to-transparent bg-[length:200%_100%] animate-shimmer" />
        </div>
        <div className="flex items-center justify-between mt-auto pt-4 border-t border-white/10">
          <div className="h-3 bg-zinc-800 rounded-md w-16 relative overflow-hidden" />
          <div className="h-6 bg-zinc-800 rounded-md w-24 relative overflow-hidden" />
        </div>
      </div>
    </div>
  )
}

export function ConcertGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <ConcertCardSkeleton key={i} />
      ))}
    </div>
  )
}
