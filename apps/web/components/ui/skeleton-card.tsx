export function ConcertCardSkeleton() {
  return (
    <div className="relative aspect-[3/4] overflow-hidden rounded-2xl border border-white/8 bg-surface sm:aspect-[4/3]">
      <div className="absolute inset-0 animate-shimmer bg-linear-to-r from-surface via-surface-high to-surface bg-[length:200%_100%]" />
      <div className="absolute bottom-0 inset-x-0 p-5 z-20 flex flex-col">
        <div className="relative mb-4 h-8 w-3/4 overflow-hidden rounded-md bg-white/8">
          <div className="absolute inset-0 animate-shimmer bg-linear-to-r from-transparent via-white/8 to-transparent bg-[length:200%_100%]" />
        </div>
        <div className="relative mb-6 h-4 w-1/2 overflow-hidden rounded-md bg-white/8">
          <div className="absolute inset-0 animate-shimmer bg-linear-to-r from-transparent via-white/8 to-transparent bg-[length:200%_100%]" />
        </div>
        <div className="flex items-center justify-between mt-auto pt-4 border-t border-white/10">
          <div className="relative h-3 w-16 overflow-hidden rounded-md bg-white/8" />
          <div className="relative h-6 w-24 overflow-hidden rounded-md bg-white/8" />
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
