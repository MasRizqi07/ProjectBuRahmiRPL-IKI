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
      className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 list-none p-0 m-0"
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
