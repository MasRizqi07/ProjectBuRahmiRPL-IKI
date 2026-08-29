'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'

export interface CircularProgressProps {
  readonly value: number
  readonly size?: number | undefined
  readonly strokeWidth?: number | undefined
  readonly label?: string | undefined
  readonly children?: React.ReactNode | undefined
  readonly className?: string | undefined
  readonly trackClassName?: string | undefined
  readonly progressClassName?: string | undefined
}

export function CircularProgress({
  value,
  size = 240,
  strokeWidth = 10,
  label,
  children,
  className,
  trackClassName,
  progressClassName,
}: CircularProgressProps) {
  const radius = (size - strokeWidth) / 2
  const circumference = radius * 2 * Math.PI
  const clampedValue = Math.min(100, Math.max(0, value))
  const offset = circumference - (clampedValue / 100) * circumference

  return (
    <div
      className={cn('relative grid place-items-center', className)}
      style={{ width: size, height: size }}
      role="img"
      aria-label={label ?? `Progres ${clampedValue}%`}
    >
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="none"
          className={cn('text-white/8', trackClassName)}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className={cn(
            'animate-stroke-dash text-war-gold transition-[stroke-dashoffset] duration-700 ease-out',
            progressClassName,
          )}
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center">
        {children}
      </div>
    </div>
  )
}

