'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  AlertTriangle,
  ArrowLeft,
  Camera,
  CheckCircle2,
  Flashlight,
  QrCode,
  RotateCcw,
  Scan,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Ticket,
  Users,
  Volume2,
  XCircle,
} from 'lucide-react'
import { Button } from '@/components/ui/button'

type ScanResult = 'idle' | 'valid' | 'used' | 'invalid'

export default function GateScannerPage() {
  const [scanState, setScanState] = useState<ScanResult>('idle')
  const [scannedCount, setScannedCount] = useState(1240)
  const [activeGate, setActiveGate] = useState('GATE 1A — VIP ENTRANCE')
  const [flashlightOn, setFlashlightOn] = useState(false)

  const triggerScan = (result: ScanResult) => {
    setScanState(result)
    if (result === 'valid') {
      setScannedCount((c) => c + 1)
    }
  }

  const resetScan = () => {
    setScanState('idle')
  }

  return (
    <main className="min-h-screen bg-black text-foreground flex flex-col justify-between p-4 sm:p-6 select-none">
      {/* Scanner Header */}
      <div className="flex items-center justify-between border-b border-white/10 pb-4">
        <Link
          href="/organizer"
          className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-bold text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" /> Keluar Scanner
        </Link>

        <div className="text-center">
          <span className="font-display text-xl tracking-wide text-war-gold">
            GATE TICKET SCANNER
          </span>
          <p className="text-[10px] text-muted-foreground font-mono">{activeGate}</p>
        </div>

        <button
          onClick={() => setFlashlightOn(!flashlightOn)}
          className={`flex size-9 items-center justify-center rounded-xl border transition ${
            flashlightOn ? 'bg-war-gold text-black border-war-gold' : 'border-white/10 bg-white/5 text-muted-foreground'
          }`}
          title="Toggle Flashlight"
        >
          <Flashlight className="size-4" />
        </button>
      </div>

      {/* Main Viewport & Camera Canvas */}
      <div className="relative my-4 mx-auto w-full max-w-md aspect-square rounded-3xl border-2 border-white/20 bg-[#0e0e0d] flex items-center justify-center overflow-hidden shadow-2xl">
        {/* Animated Laser Scanning Line */}
        <div className="absolute inset-x-0 h-1 bg-linear-to-r from-transparent via-war-gold to-transparent shadow-[0_0_15px_#f0b429] animate-scan-line z-20" />

        {/* Viewfinder Target Box */}
        <div className="relative size-60 rounded-2xl border-2 border-dashed border-war-gold/50 flex items-center justify-center">
          <div className="absolute -top-2 -left-2 size-6 border-t-4 border-l-4 border-war-gold" />
          <div className="absolute -top-2 -right-2 size-6 border-t-4 border-r-4 border-war-gold" />
          <div className="absolute -bottom-2 -left-2 size-6 border-b-4 border-l-4 border-war-gold" />
          <div className="absolute -bottom-2 -right-2 size-6 border-b-4 border-r-4 border-war-gold" />

          {scanState === 'idle' && (
            <div className="text-center text-muted-foreground p-4">
              <Camera className="size-10 mx-auto text-war-gold/60 mb-2 animate-pulse" />
              <p className="text-xs font-semibold">Arahkan kamera ke QR Code E-Ticket pengunjung</p>
            </div>
          )}
        </div>

        {/* Scan Result Overlay Modal */}
        {scanState !== 'idle' && (
          <div className="absolute inset-0 z-30 flex flex-col items-center justify-center p-6 text-center backdrop-blur-2xl animate-fade-up">
            {scanState === 'valid' && (
              <div className="w-full rounded-3xl border-2 border-status-success bg-status-success/15 p-6 shadow-[0_0_40px_rgba(16,185,129,0.3)] space-y-3">
                <CheckCircle2 className="size-16 mx-auto text-status-success" />
                <h2 className="font-display text-4xl text-status-success">TIKET VALID (PASS)</h2>
                <div className="rounded-xl bg-black/60 p-3 text-left text-xs space-y-1">
                  <p className="text-muted-foreground">Nama: <strong className="text-foreground">Rizqi Pratama</strong></p>
                  <p className="text-muted-foreground">Tier: <strong className="text-war-gold">VIP STANDING</strong></p>
                  <p className="text-muted-foreground">Seat / Spot: <strong className="text-foreground font-mono">Zone VIP-A / A-142</strong></p>
                </div>
                <Button onClick={resetScan} className="w-full rounded-xl bg-status-success text-black font-bold">
                  Scan Tiket Berikutnya
                </Button>
              </div>
            )}

            {scanState === 'used' && (
              <div className="w-full rounded-3xl border-2 border-orange-500 bg-orange-500/15 p-6 shadow-[0_0_40px_rgba(249,115,22,0.3)] space-y-3">
                <AlertTriangle className="size-16 mx-auto text-orange-500" />
                <h2 className="font-display text-3xl text-orange-400">SUDAH DIGUNAKAN!</h2>
                <p className="text-xs text-muted-foreground">Tiket telah discan di Gate 1A pada 17:15:30 WIB.</p>
                <Button onClick={resetScan} variant="outline" className="w-full rounded-xl border-orange-500 text-orange-400">
                  Tutup & Scan Ulang
                </Button>
              </div>
            )}

            {scanState === 'invalid' && (
              <div className="w-full rounded-3xl border-2 border-urgent-red bg-urgent-red/15 p-6 shadow-[0_0_40px_rgba(239,68,68,0.3)] space-y-3">
                <XCircle className="size-16 mx-auto text-urgent-red" />
                <h2 className="font-display text-4xl text-urgent-red">TIKET INVALID!</h2>
                <p className="text-xs text-muted-foreground">Kode QR tidak terdaftar atau palsu / expired screenshot.</p>
                <Button onClick={resetScan} variant="destructive" className="w-full rounded-xl font-bold">
                  Tolak Masuk & Reset
                </Button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Simulator Test Buttons & Gate Stats */}
      <div className="mx-auto w-full max-w-md space-y-4">
        {/* Simulation Controls for testing scanner */}
        <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
          <p className="text-[10px] font-black uppercase text-muted-foreground tracking-wider text-center mb-2">
            SIMULASI SCAN GATE (TESTING OPERATOR)
          </p>
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => triggerScan('valid')}
              className="rounded-xl bg-status-success/20 border border-status-success/40 py-2 text-xs font-bold text-status-success hover:bg-status-success/30 transition"
            >
              Test Valid
            </button>
            <button
              onClick={() => triggerScan('used')}
              className="rounded-xl bg-orange-500/20 border border-orange-500/40 py-2 text-xs font-bold text-orange-400 hover:bg-orange-500/30 transition"
            >
              Test Used
            </button>
            <button
              onClick={() => triggerScan('invalid')}
              className="rounded-xl bg-urgent-red/20 border border-urgent-red/40 py-2 text-xs font-bold text-urgent-red hover:bg-urgent-red/30 transition"
            >
              Test Invalid
            </button>
          </div>
        </div>

        {/* Gate Statistics Bar */}
        <div className="grid grid-cols-3 gap-2 rounded-2xl border border-white/10 bg-[#141413] p-4 text-center">
          <div>
            <span className="text-[10px] uppercase text-muted-foreground">Checked In</span>
            <p className="font-display text-2xl font-bold text-status-success">{scannedCount}</p>
          </div>
          <div className="border-x border-white/10">
            <span className="text-[10px] uppercase text-muted-foreground">Sisa Kuota</span>
            <p className="font-display text-2xl font-bold text-foreground">260</p>
          </div>
          <div>
            <span className="text-[10px] uppercase text-muted-foreground">Scan Rate</span>
            <p className="font-display text-2xl font-bold text-war-gold">35/min</p>
          </div>
        </div>
      </div>
    </main>
  )
}

