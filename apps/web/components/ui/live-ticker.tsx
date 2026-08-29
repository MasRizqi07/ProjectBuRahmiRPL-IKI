'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'

export interface TickerItem {
  readonly id: string
  readonly message: string
  readonly tone?: 'default' | 'urgent'
}

export interface LiveTickerProps {
  readonly items: readonly TickerItem[]
  readonly className?: string
}

export function LiveTicker({ items, className }: LiveTickerProps) {
  const [visible, setVisible] = React.useState<readonly TickerItem[]>(() =>
    items.slice(0, 3),
  )

  React.useEffect(() => {
    if (items.length <= 3) {
      setVisible(items)
      return
    }

    let index = 0
    const timer = setInterval(() => {
      index = (index + 1) % items.length
      setVisible([
        items[index]!,
        items[(index + 1) % items.length]!,
        items[(index + 2) % items.length]!,
      ])
    }, 3500)

    return () => clearInterval(timer)
  }, [items])

  return (
    <ul
      className={cn('space-y-2', className)}
      aria-live="polite"
      aria-label="Aktivitas langsung"
    >
      {visible.map((item) => (
        <li
          key={item.id}
          className={cn(
            'animate-fade-up rounded-xl border px-4 py-2.5 text-xs font-semibold',
            item.tone === 'urgent'
              ? 'border-destructive/30 bg-destructive/8 text-red-300'
              : 'border-war-gold/20 bg-war-gold/6 text-war-gold-bright',
          )}
        >
          {item.message}
        </li>
      ))}
    </ul>
  )
}

