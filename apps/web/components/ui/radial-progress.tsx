'use client'

import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

interface RadialProgressProps {
  progress: number // 0 to 100
  size?: number
  strokeWidth?: number
  circleColor?: string
  progressColor?: string
  children?: React.ReactNode
  className?: string
  glow?: boolean
}

export function RadialProgress({
  progress,
  size = 240,
  strokeWidth = 12,
  circleColor = 'rgba(255, 255, 255, 0.08)',
  progressColor = '#F0B429',
  children,
  className,
  glow = true,
}: RadialProgressProps) {
  const center = size / 2
  const radius = center - strokeWidth
  const circumference = 2 * Math.PI * radius
  const clampedProgress = Math.min(100, Math.max(0, progress))
  const strokeDashoffset = circumference - (clampedProgress / 100) * circumference

  return (
    <div
      className={cn('relative flex items-center justify-center', className)}
      style={{ width: size, height: size }}
    >
      {/* Background glow when active */}
      {glow && (
        <div
          className="absolute inset-4 rounded-full opacity-25 blur-2xl transition-opacity duration-1000"
          style={{ backgroundColor: progressColor }}
        />
      )}

      <svg width={size} height={size} className="-rotate-90">
        {/* Background track circle */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="transparent"
          stroke={circleColor}
          strokeWidth={strokeWidth}
        />
        {/* Animated foreground progress circle */}
        <motion.circle
          cx={center}
          cy={center}
          r={radius}
          fill="transparent"
          stroke={progressColor}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeLinecap="round"
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset }}
          transition={{ duration: 1.2, ease: 'easeOut' }}
          style={{
            filter: glow ? `drop-shadow(0 0 8px ${progressColor})` : undefined,
          }}
        />
      </svg>

      {/* Center content */}
      <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center">
        {children}
      </div>
    </div>
  )
}

