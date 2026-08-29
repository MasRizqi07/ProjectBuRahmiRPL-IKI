import type { Concert } from '@/lib/types/concert'
import { ConcertCard } from './concert-card'
import { ConcertCardSkeleton } from './ui/skeleton-card'

interface ConcertGridProps {
  concerts: Concert[]
  isLoading?: boolean
}

export function ConcertGrid({ concerts, isLoading = false }: ConcertGridProps) {
  return (
    <ul
      role="list"
      aria-label={`${concerts.length} konser tersedia`}
      className="m-0 grid list-none grid-cols-1 gap-6 p-0 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
    >
      {isLoading
        ? Array.from({ length: 6 }).map((_, i) => (
            <li key={`skeleton-${i}`} className="list-none">
              <ConcertCardSkeleton />
            </li>
          ))
        : concerts.map((concert, index) => (
            <li key={concert.id} className="list-none">
              <ConcertCard concert={concert} index={index} />
            </li>
          ))}
    </ul>
  )
}
