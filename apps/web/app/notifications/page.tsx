'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowRight, Bell, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { InlineAlert } from '@/components/feedback/inline-alert'
import { LoadingState } from '@/components/feedback/loading-state'
import { apiJson } from '@/lib/client/api'

interface NotificationItem {
  readonly id: string
  readonly category: string
  readonly title: string
  readonly body: string
  readonly action_href: string | null
  readonly read: boolean
  readonly createdAt: string
}

export default function NotificationsPage() {
  const [items, setItems] = useState<readonly NotificationItem[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    void apiJson('/api/me/notifications').then((body) => { if (!cancelled) setItems((body as { notifications: NotificationItem[] }).notifications) }).catch((cause: unknown) => { if (!cancelled) setError(cause instanceof Error ? cause.message : 'Notifikasi gagal dimuat.') })
    return () => { cancelled = true }
  }, [])

  const markAll = async (): Promise<void> => {
    try {
      await apiJson('/api/me/notifications', { method: 'PATCH', body: JSON.stringify({ markAllRead: true }) })
      setItems((current) => current?.map((item) => ({ ...item, read: true })) ?? null)
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Notifikasi gagal diperbarui.') }
  }

  return <main id="main-content" className="container-shell max-w-4xl space-y-8 py-8 sm:py-12">
    <header className="flex items-end justify-between border-b border-white/10 pb-6"><div><span className="section-label">PUSAT NOTIFIKASI</span><h1 className="mt-2 font-display text-5xl">ALERTS & UPDATES</h1></div><Button variant="outline" onClick={() => void markAll()} disabled={!items?.some((item) => !item.read)}><Check />Tandai dibaca</Button></header>
    {error && <InlineAlert variant="error">{error}</InlineAlert>}
    {!items ? <LoadingState label="Memuat notifikasi…" /> : items.length === 0 ? <div className="rounded-3xl border border-dashed border-white/10 p-12 text-center"><Bell className="mx-auto size-10 text-muted-foreground" /><p className="mt-3 text-sm">Belum ada notifikasi.</p></div> : <div className="space-y-3">{items.map((item) => <article key={item.id} className={`rounded-2xl border p-5 ${item.read ? 'border-white/8 bg-[#141413]' : 'border-war-gold/40 bg-war-gold/5'}`}><div className="flex justify-between gap-4"><div><span className="text-[10px] font-black uppercase text-war-gold">{item.category}</span><h2 className="mt-1 font-display text-xl">{item.title}</h2><p className="mt-1 text-xs leading-6 text-muted-foreground">{item.body}</p><time className="mt-2 block text-[10px] text-muted-foreground">{new Date(item.createdAt).toLocaleString('id-ID')}</time></div>{item.action_href && <Button asChild size="sm"><Link href={item.action_href}>Buka <ArrowRight /></Link></Button>}</div></article>)}</div>}
  </main>
}
