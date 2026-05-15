import type { Concert } from '@/types'
import { ConcertCard } from './concert-card'
import { ConcertCardSkeleton } from './concert-card-skeleton'

interface ConcertGridProps {
  concerts: Concert[]
  isLoading?: boolean
}

export function ConcertGrid({ concerts, isLoading = false }: ConcertGridProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6" role="grid" aria-label="Daftar konser">
      {isLoading
        ? Array.from({ length: 6 }).map((_, i) => (
            <div key={`skeleton-${i}`} role="row">
              <div role="gridcell">
                <ConcertCardSkeleton />
              </div>
            </div>
          ))
        : concerts.map((concert, index) => (
            <div key={concert.id} role="row">
              <div role="gridcell">
                <ConcertCard concert={concert} index={index} />
              </div>
            </div>
          ))}
    </div>
  )
}
