'use client'

import { useState, useEffect, use } from 'react'
import { Navbar } from '@/components/navbar'
import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

type QueueState = 'waiting' | 'processing' | 'lock_acquired'

interface WaitingRoomProps {
  searchParams: Promise<{
    concert?: string
    tier?: string
    category?: string
    price?: string
  }>
}

export default function WaitingRoom({ searchParams }: WaitingRoomProps) {
  const params = use(searchParams)
  const [state, setState] = useState<QueueState>('waiting')
  const [queuePosition, setQueuePosition] = useState(87)
  const [progress, setProgress] = useState(23)
  const [timeRemaining, setTimeRemaining] = useState(342)
  const [seatLockTime, setSeatLockTime] = useState(600)
  const [isSimulating, setIsSimulating] = useState(false)

  const concertName = params.concert?.replace('-2024', '') || 'Konser'
  const category = params.category || 'CAT 1'
  const price = params.price ? parseInt(params.price) : 0

  // Simulate queue progression
  useEffect(() => {
    if (state !== 'waiting' || !isSimulating) return

    const interval = setInterval(() => {
      setQueuePosition((prev) => {
        if (prev <= 1) {
          setState('processing')
          return 1
        }
        return prev - 1
      })
      setProgress((prev) => Math.min(prev + 0.5, 100))
    }, 500)

    return () => clearInterval(interval)
  }, [state, isSimulating])

  // Wait time countdown
  useEffect(() => {
    if (state !== 'waiting' || !isSimulating) return

    const interval = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) return 0
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [state, isSimulating])

  // Processing state timer
  useEffect(() => {
    if (state !== 'processing') return

    const timer = setTimeout(() => {
      setState('lock_acquired')
    }, 2000)

    return () => clearTimeout(timer)
  }, [state])

  // Seat lock countdown
  useEffect(() => {
    if (state !== 'lock_acquired') return

    const interval = setInterval(() => {
      setSeatLockTime((prev) => {
        if (prev <= 1) {
          setState('waiting')
          setQueuePosition(Math.floor(Math.random() * 50) + 80)
          setProgress(Math.floor(Math.random() * 30))
          setIsSimulating(false)
          return 600
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [state])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
  }

  const getTimerColor = (remaining: number) => {
    if (remaining < 120) return 'text-red-400 bg-red-950/50'
    if (remaining < 300) return 'text-amber-400 bg-amber-950/50'
    return 'text-emerald-400 bg-emerald-950/50'
  }

  const lockTimeColor = seatLockTime < 120 ? 'text-red-400' : 'text-amber-400'
  const lockBgColor = seatLockTime < 120 ? 'bg-red-950/30' : 'bg-amber-950/30'

  if (state === 'lock_acquired') {
    return (
      <div className="min-h-screen bg-zinc-950 flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center px-4 py-12">
          <div className="w-full max-w-md space-y-6">
            {/* Confirmation Message */}
            <div className="text-center mb-8 animate-fade-up">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-emerald-500/20 border border-emerald-500/50 flex items-center justify-center animate-scale-pulse">
                <div className="text-3xl">✓</div>
              </div>
              <h2 className="font-display text-2xl font-black text-foreground mb-2">Kursi Terkunci!</h2>
              <p className="text-zinc-400">Kursi Anda telah diamankan. Segera lanjutkan pembayaran sebelum waktu habis.</p>
            </div>

            {/* Ticket Summary Card */}
            <div className="border border-zinc-700/50 rounded-2xl p-6 bg-zinc-900/50">
              <div className="mb-4">
                <p className="text-xs text-zinc-500 mb-1">Konser</p>
                <p className="text-lg font-bold text-foreground">{concertName}</p>
              </div>
              <div className="pb-4 border-b border-dashed border-zinc-600">
                <p className="text-sm text-zinc-400">{category}</p>
              </div>
              <div className="mt-4 flex items-baseline justify-between">
                <span className="text-zinc-400">Total</span>
                <span className="text-2xl font-black text-amber-400">
                  Rp {price.toLocaleString('id-ID')}
                </span>
              </div>
            </div>

            {/* Countdown Timer */}
            <div className={`rounded-xl p-6 text-center ${lockBgColor}`}>
              <p className="text-xs text-zinc-400 mb-2">Waktu Tersisa</p>
              <p className={`text-5xl font-black font-mono tabular-nums ${lockTimeColor}`} aria-live="polite" aria-label={`Waktu tersisa: ${formatTime(seatLockTime)}`}>
                {formatTime(seatLockTime)}
              </p>
              {seatLockTime < 120 && (
                <p className="text-xs text-red-400 mt-3" role="alert">⚠ Kursi Anda akan dilepas dalam {seatLockTime} detik!</p>
              )}
            </div>

            {/* Proceed Button */}
            <Link href={`/payment?concert=${params.concert}&tier=${params.tier}&category=${category}&price=${price}`}>
              <Button 
                className="w-full bg-amber-400 hover:bg-amber-500 text-zinc-950 font-bold py-6 text-base"
                aria-label="Lanjut ke halaman pembayaran"
              >
                Lanjut ke Pembayaran
              </Button>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  if (state === 'processing') {
    return (
      <div className="min-h-screen bg-zinc-950 flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center px-4">
          <div className="text-center animate-fade-up">
            <div className="w-16 h-16 mx-auto mb-4 border-4 border-zinc-700 border-t-amber-400 rounded-full animate-spin" />
            <p className="text-lg font-semibold text-foreground">Mengamankan kursi Anda...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col">
      <Navbar />

      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md space-y-8">
          {/* Concert Info */}
          <div className="text-center border-b border-zinc-800 pb-6 animate-fade-up">
            <p className="text-sm text-zinc-500 mb-2">Konser yang Anda Pesan</p>
            <p className="text-2xl font-bold text-foreground mb-1">{concertName}</p>
            <p className="text-sm text-zinc-400">{category}</p>
          </div>

          {/* Queue Position with Animated Rings */}
          <div className="relative flex justify-center animate-fade-up delay-75">
            {/* Outer ring animations */}
            <style>{`
              @keyframes pulse-ring {
                0% {
                  transform: scale(1);
                  opacity: 1;
                }
                100% {
                  transform: scale(2.5);
                  opacity: 0;
                }
              }
              .ring-animation {
                animation: pulse-ring 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
              }
              .ring-animation-2 {
                animation: pulse-ring 2s cubic-bezier(0.4, 0, 0.6, 1) 0.6s infinite;
              }
              .ring-animation-3 {
                animation: pulse-ring 2s cubic-bezier(0.4, 0, 0.6, 1) 1.2s infinite;
              }
            `}</style>

            {/* Ring 1 */}
            <div className="absolute w-48 h-48 rounded-full border-2 border-amber-400/20 ring-animation" />
            {/* Ring 2 */}
            <div className="absolute w-48 h-48 rounded-full border-2 border-amber-400/10 ring-animation-2" />
            {/* Ring 3 */}
            <div className="absolute w-48 h-48 rounded-full border-2 border-amber-400/5 ring-animation-3" />

            {/* Queue Number */}
            <div className="relative z-10 text-center">
              <p className="text-sm text-zinc-500 mb-2">Posisi Antrian</p>
              <p 
                className="text-8xl sm:text-9xl font-black font-mono tabular-nums text-foreground leading-none animate-scale-pulse" 
                aria-live="polite" 
                aria-label={`Posisi antrian: ${String(queuePosition).padStart(3, '0')}`}
              >
                {String(queuePosition).padStart(3, '0')}
              </p>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="space-y-2 animate-fade-up delay-150">
            <div className="flex justify-between text-xs">
              <span className="text-zinc-500">Progres Antrian</span>
              <span className="text-amber-400 font-semibold" aria-live="polite">{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} className="h-2 bg-zinc-800" />
          </div>

          {/* Estimated Wait Time */}
          <div className={`rounded-xl p-4 text-center ${getTimerColor(timeRemaining)} animate-fade-up delay-225`}>
            <p className="text-xs text-zinc-400 mb-2">Perkiraan Waktu Tunggu</p>
            <p className="text-4xl font-black font-mono tabular-nums" aria-live="polite" aria-label={`Perkiraan waktu tunggu: ${formatTime(timeRemaining)}`}>
              {formatTime(timeRemaining)}
            </p>
          </div>

          {/* Queue ID */}
          <div className="text-center pt-4 border-t border-zinc-800 animate-fade-up delay-300">
            <p className="text-xs text-zinc-500 font-mono">Queue ID: Q-{String(queuePosition).padStart(6, '0')}</p>
          </div>

          {/* Simulation Button */}
          <div className="pt-4 animate-fade-up delay-375">
            <Button
              onClick={() => setIsSimulating(!isSimulating)}
              variant={isSimulating ? 'default' : 'outline'}
              className={`w-full ${
                isSimulating
                  ? 'bg-amber-400 hover:bg-amber-500 text-zinc-950 font-bold'
                  : 'border-amber-400/50 text-amber-400 hover:bg-amber-400/10'
              }`}
              aria-label={isSimulating ? 'Hentikan simulasi antrian' : 'Mulai simulasi antrian untuk demonstrasi'}
            >
              {isSimulating ? 'Hentikan Simulasi' : 'Simulasi Antrian'}
            </Button>
            <p className="text-xs text-zinc-500 text-center mt-2">
              {isSimulating ? 'Simulasi sedang berjalan...' : 'Tekan untuk demonstrasi transisi state'}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
