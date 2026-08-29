import * as React from 'react'
import { Flame, TrendingUp, Users } from 'lucide-react'
import { cn } from '@/lib/utils'

export type DemandLevel = 'low' | 'medium' | 'high'

const levelConfigs = {
  low: {
    width: '33%',
    label: 'Peminat rendah',
    barColor: 'bg-status-success',
    textColor: 'text-status-success',
    badgeBg: 'bg-status-success/10 border-status-success/30',
    icon: Users,
    defaultPercent: 33,
  },
  medium: {
    width: '66%',
    label: 'Peminat sedang',
    barColor: 'bg-war-gold',
    textColor: 'text-war-gold-bright',
    badgeBg: 'bg-war-gold/10 border-war-gold/30',
    icon: TrendingUp,
    defaultPercent: 66,
  },
  high: {
    width: '100%',
    label: 'Peminat tinggi',
    barColor: 'bg-destructive',
    textColor: 'text-destructive',
    badgeBg: 'bg-destructive/10 border-destructive/30',
    icon: Flame,
    defaultPercent: 100,
  },
} as const

export interface DemandMeterProps {
  readonly level: DemandLevel
  readonly percent?: number
  readonly className?: string
  readonly compact?: boolean
}

export function DemandMeter({
  level = 'medium',
  percent,
  className,
  compact = false,
}: DemandMeterProps) {
  const config = levelConfigs[level] ?? levelConfigs.medium
  const Icon = config.icon
  const displayPercent = percent ?? config.defaultPercent
  const widthStyle = percent !== undefined ? `${Math.min(100, Math.max(0, percent))}%` : config.width

  if (compact) {
    return (
      <span
        className={cn(
          'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider',
          config.badgeBg,
          config.textColor,
          className,
        )}
      >
        <Icon className="size-3 shrink-0" />
        {config.label}
      </span>
    )
  }

  return (
    <div className={cn('space-y-1', className)}>
      <div
        className="h-1.5 w-full overflow-hidden rounded-full bg-white/8"
        role="img"
        aria-label={config.label}
      >
        <div
          className={cn(
            'h-full rounded-full transition-all duration-500',
            config.barColor,
          )}
          style={{ width: widthStyle }}
        />
      </div>
      <div className="flex items-center justify-between text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        <span>{config.label}</span>
        {percent !== undefined && (
          <span className="font-mono">{displayPercent}% Terisi</span>
        )}
      </div>
    </div>
  )
}
