import { ConcertCardSkeleton } from '@/components/concert-card-skeleton'

export default function ConcertsLoading() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6" role="status" aria-live="polite">
        {Array.from({ length: 6 }).map((_, index) => (
          <div key={index}>
            <ConcertCardSkeleton />
          </div>
        ))}
      </div>
    </div>
  )
}
