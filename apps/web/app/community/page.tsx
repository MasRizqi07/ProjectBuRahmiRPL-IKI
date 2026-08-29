'use client'

import {
  CheckCircle2,
  MessageSquare,
  Send,
  Users,
} from 'lucide-react'
import { CapabilityNotice } from '@/components/feedback/capability-notice'

interface Victory {
  id: string
  user: string
  ticketInfo: string
  event: string
  timeAgo: string
}

const mockVictories: Victory[] = [
  { id: 'v1', user: '@rizqipratama', ticketInfo: '2x VIP STANDING', event: 'Coldplay Live Jakarta', timeAgo: 'Baru saja' },
  { id: 'v2', user: '@sarah_kpop', ticketInfo: '1x CAT 1 CENTER', event: 'BLACKPINK World Tour', timeAgo: '12 detik lalu' },
  { id: 'v3', user: '@dimas_rocker', ticketInfo: '4x FESTIVAL', event: 'Dewa 19 Reunion', timeAgo: '35 detik lalu' },
  { id: 'v4', user: '@anindya99', ticketInfo: '2x VIP FRONT', event: 'Electric Underground Fest', timeAgo: '1 menit lalu' },
  { id: 'v5', user: '@budi_sound', ticketInfo: '1x CAT 2 WING', event: 'Pamungkas Acoustic', timeAgo: '2 menit lalu' },
]

const chatMessages = [
  { user: 'BudiS', text: 'Server lancar banget gaes, 2 detik langsung masuk antrean!' },
  { user: 'Siti_A', text: 'Coldplay CAT 1 sisa dikit, buruan masuk waiting room!' },
  { user: 'Rian99', text: 'Gokil hold 15 menitnya beneran aman pas bayar QRIS.' },
]

export default function CommunityLiveStatusPage() {
  return (
    <main className="container-shell py-8 sm:py-12 space-y-10">
      {/* Header & Status Indicator */}
      <section className="text-center max-w-3xl mx-auto space-y-4">
        <div className="inline-flex items-center gap-2 rounded-full border border-status-success/30 bg-status-success/10 px-4 py-1.5 text-xs font-bold text-status-success">
          <span className="pulse-dot size-2 rounded-full bg-status-success" />
          <span>DESIGN PREVIEW • SAMPLE TELEMETRY</span>
        </div>
        <h1 className="font-display text-5xl sm:text-7xl tracking-wide text-foreground">
          THE FRONTLINE <span className="text-war-gold">LIVE</span>
        </h1>
        <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
          Intelijen dan telemetri langsung dari medan perang tiket konser. Pantau siapa yang berhasil mengamankan tiket secara real-time.
        </p>
      </section>

      <CapabilityNotice capability="communityMessaging" />

      {/* Live Stats Grid */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass-panel rounded-3xl p-6 flex flex-col items-center justify-center text-center">
          <Users className="size-8 text-war-gold mb-2" />
          <h2 className="font-display text-4xl text-war-gold-bright">14.592</h2>
          <p className="text-xs uppercase font-bold text-muted-foreground tracking-widest">Active Warriors Online</p>
        </div>

        <div className="glass-panel rounded-3xl p-6 md:col-span-2 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-war-gold">GLOBAL QUEUE SPEED</p>
              <h3 className="font-display text-3xl text-foreground">50.000 TPS ENGINE LOAD</h3>
            </div>
            <div className="text-right">
              <span className="font-display text-3xl text-status-success">#12ms</span>
              <p className="text-[10px] text-muted-foreground uppercase">Average Latency</p>
            </div>
          </div>
          <div className="w-full bg-white/10 h-2 rounded-full mt-4 overflow-hidden">
            <div className="bg-war-gold h-full w-[65%] rounded-full shadow-[0_0_10px_#f0b429]" />
          </div>
        </div>
      </section>

      {/* Two Column Layout: Recent Victories Feed & Live Chatter */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left: Real-time Victory Stream (7 cols) */}
        <div className="lg:col-span-7 rounded-3xl border border-white/10 bg-[#141413] p-6 space-y-4 shadow-xl">
          <div className="flex items-center justify-between border-b border-white/10 pb-4">
            <div className="flex items-center gap-2">
              <span className="flex size-2.5 rounded-full bg-status-success animate-ping" />
              <h3 className="font-display text-2xl tracking-wide text-foreground">
                RECENT VICTORIES STREAM
              </h3>
            </div>
            <span className="text-[11px] font-mono text-muted-foreground">LIVE FEED</span>
          </div>

          <div className="space-y-3">
            {mockVictories.map((v) => (
              <div
                key={v.id}
                className="flex items-center justify-between rounded-2xl border border-white/5 bg-black/40 p-4 hover:border-war-gold/30 transition group"
              >
                <div className="flex items-center gap-3.5">
                  <div className="flex size-10 items-center justify-center rounded-xl bg-status-success/10 text-status-success">
                    <CheckCircle2 className="size-5" />
                  </div>
                  <div>
                    <p className="text-xs text-foreground">
                      <strong className="text-war-gold font-bold">{v.user}</strong> mengamankan{' '}
                      <strong className="text-foreground">{v.ticketInfo}</strong>
                    </p>
                    <p className="text-[11px] text-muted-foreground font-semibold">{v.event}</p>
                  </div>
                </div>

                <span className="text-[10px] font-mono text-muted-foreground">{v.timeAgo}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Live Community Chatter Box (5 cols) */}
        <div className="lg:col-span-5 rounded-3xl border border-white/10 bg-[#141413] p-6 flex flex-col justify-between shadow-xl min-h-[420px]">
          <div>
            <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-4">
              <div className="flex items-center gap-2">
                <MessageSquare className="size-4 text-war-gold" />
                <h3 className="font-display text-xl tracking-wide text-foreground">
                  WAR CHATTER ROOM
                </h3>
              </div>
              <span className="text-[10px] font-bold text-status-success">● 1.2K CHATTING</span>
            </div>

            <div className="space-y-3 overflow-y-auto max-h-64 pr-2">
              {chatMessages.map((msg, i) => (
                <div key={i} className="rounded-xl bg-white/4 p-3 text-xs">
                  <span className="font-bold text-war-gold-bright">{msg.user}: </span>
                  <span className="text-muted-foreground">{msg.text}</span>
                </div>
              ))}
            </div>
          </div>

          <form onSubmit={(event) => event.preventDefault()} className="mt-4 flex items-center gap-2 border-t border-white/10 pt-4">
            <input
              disabled
              type="text"
              placeholder="Chat realtime belum tersedia"
              className="flex-1 rounded-xl border border-white/10 bg-black/50 px-3.5 py-2.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-hidden focus:border-war-gold"
            />
            <button
              disabled
              type="submit"
              title="Chat realtime belum tersedia"
              className="flex size-9 cursor-not-allowed items-center justify-center rounded-xl bg-primary text-primary-foreground opacity-60"
            >
              <Send className="size-4" />
            </button>
          </form>
        </div>
      </section>
    </main>
  )
}
