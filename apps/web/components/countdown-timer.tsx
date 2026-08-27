'use client'
import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface CountdownTimerProps {
  targetDate: string
  onComplete?: () => void
}

interface TimeLeft {
  days: number
  hours: number
  minutes: number
  seconds: number
}

function FlipDigit({ value }: { value: number }) {
  const display = String(value).padStart(2, '0')
  
  return (
    <div className="relative flex h-16 w-12 items-center justify-center overflow-hidden rounded-lg border border-white/10 bg-black/35 sm:h-20 sm:w-16">
      <AnimatePresence mode="popLayout">
        <motion.span
          key={display}
          initial={{ rotateX: -90, opacity: 0 }}
          animate={{ rotateX: 0, opacity: 1 }}
          exit={{ rotateX: 90, opacity: 0 }}
          transition={{ duration: 0.3, ease: 'easeInOut' }}
          className="absolute font-mono text-2xl font-bold text-white sm:text-3xl"
        >
          {display}
        </motion.span>
      </AnimatePresence>
      <div className="absolute inset-x-0 top-1/2 h-px bg-black/50 z-10" />
    </div>
  )
}

export function CountdownTimer({ targetDate, onComplete }: CountdownTimerProps) {
  const [timeLeft, setTimeLeft] = useState<TimeLeft>({ days: 0, hours: 0, minutes: 0, seconds: 0 })
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
    let completed = false
    const calculate = () => {
      const diff = new Date(targetDate).getTime() - Date.now()
      if (diff <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 })
        if (!completed) { completed = true; onComplete?.() }
        return true
      }
      
      setTimeLeft({
        days: Math.floor(diff / 86400000),
        hours: Math.floor((diff % 86400000) / 3600000),
        minutes: Math.floor((diff % 3600000) / 60000),
        seconds: Math.floor((diff % 60000) / 1000),
      })
      return false
    }

    if (calculate()) return
    const interval = setInterval(calculate, 1000)
    return () => clearInterval(interval)
  }, [targetDate, onComplete])

  if (!isMounted) return null

  const units = [
    { label: 'HARI', value: timeLeft.days },
    { label: 'JAM', value: timeLeft.hours },
    { label: 'MENIT', value: timeLeft.minutes },
    { label: 'DETIK', value: timeLeft.seconds },
  ]

  return (
    <div className="flex items-center gap-2 sm:gap-3" role="timer" aria-label="Hitung mundur konser">
      {units.map((unit, i) => (
        <div key={unit.label} className="flex flex-col items-center gap-2 relative">
          <FlipDigit value={unit.value} />
          <span className="text-xs text-white/40 tracking-widest font-body">{unit.label}</span>
          {i < units.length - 1 && (
            <span className="absolute -right-1.5 top-5 font-mono text-xl text-white/60 sm:-right-2 sm:top-6 sm:text-2xl">:</span>
          )}
        </div>
      ))}
    </div>
  )
}
