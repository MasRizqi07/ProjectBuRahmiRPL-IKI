'use client'

import { useEffect, useState } from 'react'
import { Navbar } from '@/components/navbar'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

export default function OrderConfirmationPage() {
  const [showConfetti, setShowConfetti] = useState(false)
  const [animate, setAnimate] = useState(false)

  useEffect(() => {
    setShowConfetti(true)
    setAnimate(true)
  }, [])

  // Simulate confetti animation
  useEffect(() => {
    if (!showConfetti) return

    const canvas = document.getElementById('confetti-canvas') as HTMLCanvasElement
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    canvas.width = window.innerWidth
    canvas.height = window.innerHeight

    const particles: Array<{
      x: number
      y: number
      vx: number
      vy: number
      size: number
      color: string
      life: number
    }> = []

    // Create confetti particles
    for (let i = 0; i < 50; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: -10,
        vx: (Math.random() - 0.5) * 8,
        vy: Math.random() * 5 + 3,
        size: Math.random() * 4 + 2,
        color: Math.random() > 0.5 ? '#fbbf24' : '#ffffff',
        life: 1,
      })
    }

    let animationId: number
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i]
        if (!p) continue
        p.x += p.vx
        p.y += p.vy
        p.vy += 0.1 // gravity
        p.life -= 0.01

        if (p.life <= 0) {
          particles.splice(i, 1)
          continue
        }

        ctx.globalAlpha = p.life
        ctx.fillStyle = p.color
        ctx.fillRect(p.x, p.y, p.size, p.size)
      }

      if (particles.length > 0) {
        animationId = requestAnimationFrame(animate)
      }
    }

    animate()
    return () => cancelAnimationFrame(animationId)
  }, [showConfetti])

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Confetti Canvas */}
      <canvas
        id="confetti-canvas"
        className={`fixed inset-0 pointer-events-none ${showConfetti ? 'display-block' : 'display-none'}`}
      />

      <div className="max-w-2xl mx-auto px-4 py-12">
        {/* Animated Checkmark */}
        <div className="text-center mb-12">
          <div className="inline-block mb-8">
            <svg
              width="120"
              height="120"
              viewBox="0 0 120 120"
              className={`transition-all duration-1000 ${animate ? 'opacity-100 scale-100' : 'opacity-0 scale-0'}`}
            >
              <circle
                cx="60"
                cy="60"
                r="55"
                fill="none"
                stroke="#22c55e"
                strokeWidth="3"
                className="animate-pulse"
              />
              <path
                d="M 35 60 L 50 75 L 85 40"
                fill="none"
                stroke="#22c55e"
                strokeWidth="6"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeDasharray="100"
                strokeDashoffset={animate ? '0' : '100'}
                className="animate-stroke-dash"
              />
            </svg>
          </div>

          <h1 className="font-display text-4xl font-black text-foreground mb-2">Tiket Berhasil Dibeli!</h1>
          <p className="text-lg text-zinc-400 mb-8">
            E-tiket Anda telah dikirim ke email. Silakan cek inbox atau folder spam.
          </p>
        </div>

        {/* E-Ticket Card */}
        <div
          className="border-2 border-dashed border-zinc-600 rounded-2xl p-8 bg-zinc-900/50 mb-8 dotted-pattern"
        >
          <div className="text-center mb-8 pb-8 border-b-2 border-dashed border-zinc-600">
            <p className="text-xs text-zinc-500 mb-2">TIKET MASUK</p>
            <h2 className="font-display text-2xl font-black text-foreground mb-2">Coldplay</h2>
            <p className="text-sm text-zinc-400">Gelora Bung Karno, Jakarta</p>
            <p className="text-sm text-amber-400 font-semibold mt-2">22 Juni 2024, 19:00 WIB</p>
          </div>

          <div className="grid grid-cols-2 gap-6 mb-8 pb-8 border-b-2 border-dashed border-zinc-600">
            <div>
              <p className="text-xs text-zinc-500 mb-1">Kategori Tiket</p>
              <p className="text-lg font-bold text-foreground">CAT 1</p>
            </div>
            <div>
              <p className="text-xs text-zinc-500 mb-1">Jumlah</p>
              <p className="text-lg font-bold text-foreground">1 Tiket</p>
            </div>
            <div>
              <p className="text-xs text-zinc-500 mb-1">No. Kursi</p>
              <p className="text-lg font-bold text-foreground">A-123</p>
            </div>
            <div>
              <p className="text-xs text-zinc-500 mb-1">Order ID</p>
              <p className="text-lg font-bold text-amber-400 font-mono">#ORD-2024-0001</p>
            </div>
          </div>

          {/* QR Code Placeholder */}
          <div className="flex justify-center mb-8">
            <div
              className="w-32 h-32 bg-zinc-800 border border-zinc-700 rounded-lg flex items-center justify-center qr-pattern"
            >
              <p className="text-xs text-zinc-600">QR Code</p>
            </div>
          </div>

          <p className="text-xs text-zinc-500 text-center font-mono">Tunjukkan QR Code ini di pintu masuk</p>
        </div>

        {/* Action Buttons */}
        <div className="grid sm:grid-cols-2 gap-4">
          <Button className="bg-zinc-900 hover:bg-zinc-800 text-foreground border border-zinc-700 font-bold py-6 rounded-xl">
            Download E-Ticket
          </Button>
          <Link href="/my-tickets">
            <Button className="w-full bg-amber-400 hover:bg-amber-500 text-zinc-950 font-bold py-6 rounded-xl">
              Lihat Semua Tiket
            </Button>
          </Link>
        </div>

        {/* Additional Info */}
        <div className="mt-12 border-t border-zinc-800 pt-8">
          <h3 className="font-display font-bold text-foreground mb-4">Informasi Penting</h3>
          <ul className="space-y-2 text-sm text-zinc-400">
            <li>• Tunjukkan e-tiket ini atau QR code di pintu masuk</li>
            <li>• 1 QR code hanya bisa digunakan sekali</li>
            <li>• Harap tiba 30 menit sebelum acara dimulai</li>
            <li>• Cek email untuk informasi lebih lanjut</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
