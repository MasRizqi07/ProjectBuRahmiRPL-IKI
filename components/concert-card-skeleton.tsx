'use client'

export function ConcertCardSkeleton() {
  return (
    <div className="h-full flex flex-col rounded-2xl border border-zinc-700/50 overflow-hidden bg-card animate-pulse">
      {/* Image Skeleton */}
      <div className="h-40 sm:h-48 bg-zinc-800/50" />

      {/* Content Skeleton */}
      <div className="flex-1 p-4 sm:p-5 flex flex-col space-y-4">
        {/* Artist/Title Skeleton */}
        <div className="space-y-2">
          <div className="h-5 bg-zinc-800/50 rounded w-3/4" />
          <div className="h-3 bg-zinc-800/50 rounded w-full" />
          <div className="h-3 bg-zinc-800/50 rounded w-2/3" />
        </div>

        {/* Date Skeleton */}
        <div className="h-3 bg-zinc-800/50 rounded w-1/3" />

        {/* Price Skeleton */}
        <div className="pb-4 border-b border-zinc-700/50">
          <div className="h-3 bg-zinc-800/50 rounded w-1/4 mb-2" />
          <div className="h-5 bg-zinc-800/50 rounded w-1/2" />
        </div>

        {/* Badge Skeleton */}
        <div className="mt-auto flex justify-between">
          <div className="h-6 bg-zinc-800/50 rounded w-24" />
          <div className="h-5 w-5 bg-zinc-800/50 rounded" />
        </div>
      </div>
    </div>
  )
}
