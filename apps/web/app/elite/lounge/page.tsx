'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  ArrowLeft,
  ArrowRight,
  Crown,
  Flame,
  Headphones,
  Lock,
  MapPin,
  MessageCircle,
  Radio,
  Send,
  ShieldCheck,
  Sparkles,
  Star,
  Ticket,
  Wine,
  Zap,
} from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function VanguardLoungePage() {
  const [conciergeInput, setConciergeInput] = useState('')
  const [conciergeChat, setConciergeChat] = useState([
    { sender: 'concierge', text: 'Selamat datang di Vanguard Lounge, Commander Rizqi. Bagaimana saya dapat membantu alokasi tiket VIP Anda hari ini?' },
  ])

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault()
    if (!conciergeInput.trim()) return
    const newMsg = { sender: 'user', text: conciergeInput }
    setConciergeChat((prev) => [
      ...prev,
      newMsg,
      { sender: 'concierge', text: 'Permintaan Anda telah dicatat. Concierge kami sedang mengamankan alokasi kursi VVIP khusus untuk Anda.' },
    ])
    setConciergeInput('')
  }

  return (
    <main className="container-shell py-8 sm:py-12 space-y-12 max-w-6xl">
      {/* Lounge Header */}
      <div className="relative overflow-hidden rounded-3xl border border-war-gold/40 bg-linear-to-r from-[#2a220d] via-[#161514] to-[#0a0a09] p-8 sm:p-12 shadow-[0_20px_60px_rgba(240,180,41,0.2)]">
        <div className="absolute -right-20 -top-20 size-80 rounded-full bg-war-gold/15 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-war-gold bg-war-gold/20 px-3.5 py-1 text-xs font-black text-war-gold-bright tracking-widest uppercase">
                <Crown className="size-4 text-war-gold" /> VANGUARD PLATINUM LOUNGE
              </span>
              <span className="text-xs font-bold text-status-success">● PRIVAT & TERENKRIPSI</span>
            </div>
            <h1 className="mt-3 font-display text-4xl sm:text-6xl tracking-wide text-foreground">
              RUANG EKSKLUSIF <span className="text-war-gold">VIP COMMANDER</span>
            </h1>
            <p className="mt-1 text-xs sm:text-sm text-muted-foreground max-w-xl leading-relaxed">
              Akses khusus untuk anggota Platinum. Dapatkan tiket konser rahasia (Secret Drop), reservasi sofa VIP, dan layanan concierge 24/7.
            </p>
          </div>

          <Link
            href="/elite"
            className="flex items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-4 py-2.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition"
          >
            <ArrowLeft className="size-3.5" /> Info Membership
          </Link>
        </div>
      </div>

      {/* Secret War Drops Section */}
      <section className="space-y-6">
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div>
            <span className="text-xs font-bold uppercase tracking-widest text-war-gold">
              UNANNOUNCED SECRET DROPS
            </span>
            <h2 className="mt-1 font-display text-3xl text-foreground">
              Konser Rahasia & Alokasi VVIP Khusus
            </h2>
          </div>
          <span className="rounded-full bg-urgent-red/20 border border-urgent-red/40 px-3 py-1 text-xs font-bold text-urgent-red">
            HANYA MEMBER PLATINUM
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="rounded-3xl border border-war-gold/30 bg-[#161514] p-6 hover:border-war-gold transition-all shadow-xl space-y-4">
            <div className="flex items-start justify-between">
              <span className="rounded-full bg-war-gold px-3 py-1 text-[10px] font-black text-black uppercase">
                PRIVATE INTIMATE GIG
              </span>
              <span className="font-mono text-xs font-bold text-war-gold">SISA 8 SEAT</span>
            </div>
            <h3 className="font-display text-3xl text-foreground">
              BRUNO MARS EXCLUSIVE ACOUSTIC SESSION
            </h3>
            <p className="text-xs text-muted-foreground">
              Venue: The Grand Ballroom Jakarta • 50 Tamu VIP Terpilih • Full Fine Dining & Open Bar.
            </p>
            <div className="flex items-center justify-between pt-4 border-t border-white/8">
              <div>
                <span className="text-[10px] uppercase text-muted-foreground">Harga Khusus Member</span>
                <p className="font-display text-2xl text-war-gold-bright">Rp 8.500.000</p>
              </div>
              <Button asChild className="rounded-xl bg-primary font-bold text-primary-foreground hover:bg-war-gold-bright">
                <Link href="/payment">Klaim Seat VIP</Link>
              </Button>
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-[#161514] p-6 hover:border-war-gold/30 transition-all shadow-xl space-y-4">
            <div className="flex items-start justify-between">
              <span className="rounded-full bg-blue-500/20 border border-blue-500/40 px-3 py-1 text-[10px] font-bold text-blue-400 uppercase">
                BACKSTAGE PASS DROP
              </span>
              <span className="font-mono text-xs font-bold text-status-success">TERSEDIA</span>
            </div>
            <h3 className="font-display text-3xl text-foreground">
              DWP 2026 — ULTRA VIP ROYAL LOUNGE BOX
            </h3>
            <p className="text-xs text-muted-foreground">
              Venue: JIEXPO Kemayoran • Private Suite Box (Kapasitas 10 Orang) • Meet & Greet Headliner.
            </p>
            <div className="flex items-center justify-between pt-4 border-t border-white/8">
              <div>
                <span className="text-[10px] uppercase text-muted-foreground">Harga Suite Box</span>
                <p className="font-display text-2xl text-war-gold-bright">Rp 45.000.000</p>
              </div>
              <Button asChild className="rounded-xl bg-primary font-bold text-primary-foreground hover:bg-war-gold-bright">
                <Link href="/payment">Reservasi Box</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* 24/7 Dedicated VIP Concierge Live Chat */}
      <section className="rounded-3xl border border-white/10 bg-[#141413] p-6 sm:p-8 space-y-6">
        <div className="flex items-center justify-between border-b border-white/8 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex size-11 items-center justify-center rounded-2xl bg-war-gold/10 text-war-gold border border-war-gold/30">
              <Headphones className="size-6" />
            </div>
            <div>
              <h3 className="font-display text-2xl text-foreground">
                24/7 Dedicated VIP Concierge
              </h3>
              <p className="text-xs text-status-success">● Concierge Senior Online (Elena V.)</p>
            </div>
          </div>
          <span className="text-xs font-mono text-muted-foreground hidden sm:block">Response Time: &lt; 30s</span>
        </div>

        <div className="space-y-3 max-h-72 overflow-y-auto pr-2">
          {conciergeChat.map((chat, idx) => (
            <div
              key={idx}
              className={`flex ${chat.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-lg rounded-2xl p-4 text-xs leading-relaxed ${
                  chat.sender === 'user'
                    ? 'bg-war-gold text-black font-semibold'
                    : 'bg-white/5 border border-white/10 text-foreground'
                }`}
              >
                {chat.text}
              </div>
            </div>
          ))}
        </div>

        <form onSubmit={handleSendMessage} className="flex items-center gap-2 pt-2 border-t border-white/8">
          <input
            type="text"
            value={conciergeInput}
            onChange={(e) => setConciergeInput(e.target.value)}
            placeholder="Ketik instruksi pemesanan tiket / request khusus VVIP..."
            className="flex-1 rounded-xl border border-white/10 bg-black/60 px-4 py-3 text-xs text-foreground placeholder:text-muted-foreground focus:outline-hidden focus:border-war-gold"
          />
          <Button type="submit" className="rounded-xl bg-primary px-6 font-bold text-primary-foreground hover:bg-war-gold-bright">
            <Send className="size-4 mr-1.5" /> Kirim
          </Button>
        </form>
      </section>
    </main>
  )
}

