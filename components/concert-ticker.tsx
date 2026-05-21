import { Concert } from '@/lib/types/concert'

export function ConcertTicker({ concerts }: { concerts: Concert[] }) {
  // Duplicate for seamless loop
  const items = [...concerts, ...concerts, ...concerts]
  
  return (
    <div className="overflow-hidden py-6 border-y border-white/5 bg-zinc-950/50 backdrop-blur-sm relative z-20">
      <div className="ticker-row ticker-left mb-4">
        {items.map((c, i) => (
          <span key={`left-${i}`} className="ticker-item font-display uppercase tracking-widest text-sm text-white/30 mx-8 whitespace-nowrap">
            {c.artist} <span className="text-violet-500 mx-4">◆</span> {c.venue}
          </span>
        ))}
      </div>
      <div className="ticker-row ticker-right">
        {[...items].reverse().map((c, i) => (
          <span key={`right-${i}`} className="ticker-item font-display uppercase tracking-widest text-sm text-white/20 mx-8 whitespace-nowrap">
            {c.city} <span className="text-purple-500 mx-4">◆</span> {c.title}
          </span>
        ))}
      </div>
    </div>
  )
}
