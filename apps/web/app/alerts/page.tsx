'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowRight, Bell, Check, Clock, Info, ShieldAlert, Sparkles, Tag } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { InlineAlert } from '@/components/feedback/inline-alert'
import { LoadingState } from '@/components/feedback/loading-state'
import { apiJson } from '@/lib/client/api'
import { cn } from '@/lib/utils'

interface NotificationItem {
  readonly id: string
  readonly category: string
  readonly title: string
  readonly body: string
  readonly action_href: string | null
  readonly read: boolean
  readonly createdAt: string
}

const categoryIcons = {
  war: Sparkles,
  order: Check,
  system: Info,
  promo: Tag,
  support: ShieldAlert,
} as const

export default function AlertsPage() {
  const [items, setItems] = useState<readonly NotificationItem[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    void apiJson('/api/me/notifications')
      .then((body) => {
        if (!cancelled) setItems((body as { notifications: NotificationItem[] }).notifications)
      })
      .catch((cause: unknown) => {
        if (!cancelled) setError(cause instanceof Error ? cause.message : 'Notifikasi gagal dimuat.')
      })
    return () => {
      cancelled = true
    }
  }, [])

  const markAll = async (): Promise<void> => {
    try {
      await apiJson('/api/me/notifications', {
        method: 'PATCH',
        body: JSON.stringify({ markAllRead: true }),
      })
      setItems((current) => current?.map((item) => ({ ...item, read: true })) ?? null)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Notifikasi gagal diperbarui.')
    }
  }

  return (
    <main id="main-content" className="container-shell max-w-4xl space-y-8 py-8 sm:py-12">
      <header className="flex flex-col justify-between gap-4 border-b border-white/10 pb-6 sm:flex-row sm:items-end">
        <div>
          <span className="section-label">PUSAT NOTIFIKASI</span>
          <h1 className="mt-2 font-display text-4xl sm:text-5xl">NOTIFIKASI & UPDATE</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Pemberitahuan resmi antrean tiket, status pembayaran, dan pengumuman promotor.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => void markAll()}
          disabled={!items?.some((item) => !item.read)}
          className="rounded-xl border-white/10"
        >
          <Check className="size-4" />
          Tandai semua dibaca
        </Button>
      </header>

      {error && <InlineAlert variant="error">{error}</InlineAlert>}

      {!items ? (
        <LoadingState label="Memuat pemberitahuan…" />
      ) : items.length === 0 ? (
        <div className="glass-panel flex flex-col items-center justify-center rounded-3xl p-12 text-center">
          <div className="flex size-14 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-war-gold">
            <Bell className="size-7" />
          </div>
          <h3 className="mt-4 font-display text-2xl text-foreground">
            Belum Ada Notifikasi Baru
          </h3>
          <p className="mt-1 max-w-sm text-xs text-muted-foreground">
            Update antrean war tiket dan konfirmasi pembayaran akan langsung muncul di sini.
          </p>
          <Button asChild variant="outline" size="sm" className="mt-5 rounded-xl">
            <Link href="/concerts">Jelajahi Konser</Link>
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((item) => {
            const Icon = (categoryIcons as Record<string, typeof Sparkles>)[item.category] ?? Bell
            return (
              <article
                key={item.id}
                className={cn(
                  'interactive-lift glass-panel flex flex-col justify-between gap-4 rounded-2xl p-5 sm:flex-row sm:items-center',
                  !item.read && 'border-war-gold/40 bg-war-gold/5',
                )}
              >
                <div className="flex items-start gap-4">
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-war-gold">
                    <Icon className="size-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-black uppercase tracking-wider text-war-gold">
                        {item.category}
                      </span>
                      {!item.read && (
                        <span className="pulse-dot size-2 rounded-full bg-war-gold" />
                      )}
                    </div>
                    <h2 className="mt-1 font-display text-xl text-foreground">{item.title}</h2>
                    <p className="mt-1 text-xs text-muted-foreground">{item.body}</p>
                    <time className="mt-2 flex items-center gap-1 text-[10px] text-muted-foreground">
                      <Clock className="size-3" />
                      {new Date(item.createdAt).toLocaleString('id-ID')}
                    </time>
                  </div>
                </div>

                {item.action_href && (
                  <Button asChild size="sm" className="shrink-0 gap-1.5 rounded-xl font-bold">
                    <Link href={item.action_href}>
                      Lihat <ArrowRight className="size-4" />
                    </Link>
                  </Button>
                )}
              </article>
            )
          })}
        </div>
      )}
    </main>
  )
}

