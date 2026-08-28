import { Flame, TrendingUp, Users } from 'lucide-react'
import { cn } from '@/lib/utils'

export type DemandLevel = 'low' | 'medium' | 'high' | 'extreme'

interface DemandMeterProps {
  level?: DemandLevel
  percent?: number
  className?: string
  compact?: boolean
}

export function DemandMeter({
  level = 'medium',
  percent,
  className,
  compact = false,
}: DemandMeterProps) {
  const configs = {
    low: {
      label: 'Normal Demand',
      color: 'text-blue-400',
      barColor: 'bg-blue-500',
      badgeBg: 'bg-blue-500/10 border-blue-500/25',
      icon: Users,
      defaultPercent: 35,
    },
    medium: {
      label: 'High Demand',
      color: 'text-war-gold-bright',
      barColor: 'bg-war-gold',
      badgeBg: 'bg-war-gold/10 border-war-gold/30',
      icon: TrendingUp,
      defaultPercent: 72,
    },
    high: {
      label: 'War Active 🔥',
      color: 'text-orange-400',
      barColor: 'bg-orange-500',
      badgeBg: 'bg-orange-500/10 border-orange-500/30',
      icon: Flame,
      defaultPercent: 91,
    },
    extreme: {
      label: 'CRITICAL WAR ⚡',
      color: 'text-status-danger',
      barColor: 'bg-status-danger',
      badgeBg: 'bg-status-danger/10 border-status-danger/30',
      icon: Flame,
      defaultPercent: 98,
    },
  }

  const current = configs[level]
  const Icon = current.icon
  const displayPercent = percent ?? current.defaultPercent

  if (compact) {
    return (
      <span
        className={cn(
          'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider',
          current.badgeBg,
          current.color,
          className
        )}
      >
        <Icon className="size-3 shrink-0" />
        {current.label}
      </span>
    )
  }

  return (
    <div className={cn('space-y-1.5', className)}>
      <div className="flex items-center justify-between text-xs">
        <span className={cn('inline-flex items-center gap-1.5 font-bold uppercase tracking-wider', current.color)}>
          <Icon className="size-3.5" />
          {current.label}
        </span>
        <span className="font-mono text-[11px] font-semibold text-muted-foreground">
          {displayPercent}% Terisi
        </span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/8">
        <div
          className={cn('h-full rounded-full transition-all duration-700 ease-out', current.barColor)}
          style={{ width: `${displayPercent}%` }}
        />
      </div>
    </div>
  )
}

