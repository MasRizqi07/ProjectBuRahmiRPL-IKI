'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowRight, Flame, Radio, Send, Sparkles, Trophy } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { InlineAlert } from '@/components/feedback/inline-alert'
import { LoadingState } from '@/components/feedback/loading-state'
import { apiJson } from '@/lib/client/api'

interface Message {
  readonly id: number
  readonly body: string
  readonly author: string
  readonly created_at: string
}

export default function CommunityPage() {
  const [messages, setMessages] = useState<readonly Message[] | null>(null)
  const [body, setBody] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [sending, setSending] = useState(false)

  const load = useCallback(async (): Promise<void> => {
    try {
      const data = (await apiJson('/api/community/messages')) as { messages: Message[] }
      setMessages(data.messages)
      setError(null)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Community feed gagal dimuat.')
    }
  }, [])

  useEffect(() => {
    void load()
    const timer = setInterval(() => void load(), 15_000)
    return () => clearInterval(timer)
  }, [load])

  const send = async (event: React.FormEvent): Promise<void> => {
    event.preventDefault()
    if (!body.trim()) return
    setSending(true)
    try {
      await apiJson('/api/community/messages', {
        method: 'POST',
        body: JSON.stringify({ body }),
      })
      setBody('')
      await load()
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Pesan gagal dikirim.')
    } finally {
      setSending(false)
    }
  }

  return (
    <main id="main-content" className="container-shell max-w-5xl space-y-8 py-8 sm:py-12">
      <header className="border-b border-white/10 pb-6">
        <span className="section-label">KOMUNITAS & STATUS LIVE</span>
        <h1 className="mt-2 flex items-center gap-3 font-display text-4xl sm:text-5xl">
          <Radio className="size-8 text-status-success animate-pulse" />
          WAR TICKET LIVE FEED
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Ruang diskusi publik sesama penikmat musik, tips antrean war tiket, dan kemenangan terbaru.
        </p>
      </header>

      {error && <InlineAlert variant="error">{error}</InlineAlert>}

      {/* Community Highlights Grid */}
      <div className="grid gap-6 sm:grid-cols-2">
        <div className="glass-panel space-y-3 rounded-3xl p-6">
          <div className="flex items-center gap-2 text-war-gold-bright">
            <Trophy className="size-5" />
            <h2 className="font-display text-2xl">Kemenangan Tiket Terbaru</h2>
          </div>
          <p className="text-xs text-muted-foreground">
            Ribuan tiket berhasil diamankan secara adil melalui antrean FIFO transparan.
          </p>
          <div className="rounded-2xl border border-white/8 bg-white/4 p-3.5 text-xs">
            <span className="font-bold text-status-success">✓ 18,450+ Tiket Terbit</span>
            <p className="mt-1 text-muted-foreground">Rata-rata waktu checkout: &lt; 2 menit</p>
          </div>
        </div>

        <div className="glass-panel space-y-3 rounded-3xl p-6">
          <div className="flex items-center gap-2 text-orange-400">
            <Flame className="size-5" />
            <h2 className="font-display text-2xl">Pertempuran Mendatang</h2>
          </div>
          <p className="text-xs text-muted-foreground">
            Konser dengan antusiasme tertinggi yang akan membuka tiket war dalam waktu dekat.
          </p>
          <Button asChild variant="outline" size="sm" className="rounded-xl border-white/10">
            <Link href="/concerts" className="flex items-center gap-2">
              Lihat Kalender War <ArrowRight className="size-4" />
            </Link>
          </Button>
        </div>
      </div>

      {/* Message Box */}
      <section className="glass-panel space-y-6 rounded-3xl p-6 sm:p-8">
        <div className="flex items-center gap-2">
          <Sparkles className="size-5 text-war-gold" />
          <h2 className="font-display text-2xl">Obrolan Langsung Komunitas</h2>
        </div>

        <form onSubmit={(e) => void send(e)} className="flex gap-3">
          <input
            value={body}
            onChange={(e) => setBody(e.target.value)}
            maxLength={500}
            required
            placeholder="Bagikan tips war tiket atau sapa penonton lain…"
            className="min-w-0 flex-1 rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-foreground focus:border-war-gold focus:outline-none"
          />
          <Button
            type="submit"
            disabled={sending || body.trim().length === 0}
            className="gap-2 rounded-xl px-6 font-bold"
          >
            <Send className="size-4" />
            {sending ? 'Mengirim…' : 'Kirim'}
          </Button>
        </form>

        {!messages ? (
          <LoadingState label="Menghubungkan live chat…" />
        ) : messages.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-white/10 p-8 text-center text-xs text-muted-foreground">
            Belum ada pesan obrolan. Jadilah yang pertama menyapa komunitas!
          </div>
        ) : (
          <div className="space-y-3">
            {messages.map((message) => (
              <article
                key={message.id}
                className="rounded-2xl border border-white/8 bg-[#141413] p-4 transition-colors hover:border-white/15"
              >
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-war-gold">{message.author}</span>
                  <time className="font-mono text-[10px] text-muted-foreground">
                    {new Date(message.created_at).toLocaleTimeString('id-ID', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </time>
                </div>
                <p className="mt-2 text-xs leading-relaxed text-foreground/90 whitespace-pre-wrap">
                  {message.body}
                </p>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  )
}
