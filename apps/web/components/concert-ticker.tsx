import type { Concert } from '@/lib/types/concert'

export function ConcertTicker({ concerts }: { concerts: Concert[] }) {
  // Duplicate for seamless loop
  const items = [...concerts, ...concerts, ...concerts]
  
  return (
    <div className="relative z-20 overflow-hidden border-y border-white/5 bg-surface-lowest/60 py-6 backdrop-blur-sm">
      <div className="ticker-row ticker-left mb-4">
        {items.map((c, i) => (
          <span key={`left-${i}`} className="ticker-item font-display uppercase tracking-widest text-sm text-white/30 mx-8 whitespace-nowrap">
            {c.artist} <span className="mx-4 text-war-gold">◆</span> {c.venue}
          </span>
        ))}
      </div>
      <div className="ticker-row ticker-right">
        {[...items].reverse().map((c, i) => (
          <span key={`right-${i}`} className="ticker-item font-display uppercase tracking-widest text-sm text-white/20 mx-8 whitespace-nowrap">
            {c.city} <span className="mx-4 text-war-gold">◆</span> {c.title}
          </span>
        ))}
      </div>
    </div>
  )
}
