'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import {
  Clock,
  Plus,
  ShieldCheck,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { InlineAlert } from '@/components/feedback/inline-alert'
import { LoadingState } from '@/components/feedback/loading-state'
import { apiJson } from '@/lib/client/api'

interface SupportCase {
  readonly id: string
  readonly order_id: string | null
  readonly subject: string
  readonly description: string
  readonly status: 'OPEN' | 'IN_REVIEW' | 'RESOLVED' | 'CLOSED'
  readonly created_at: string
  readonly updated_at: string
}

type TabKey = 'all' | 'in_review' | 'resolved'

const statusBadges = {
  OPEN: { label: 'Dibuka', color: 'text-war-gold border-war-gold/30 bg-war-gold/10' },
  IN_REVIEW: { label: 'Dalam Investigasi', color: 'text-cyan-400 border-cyan-400/30 bg-cyan-400/10' },
  RESOLVED: { label: 'Selesai', color: 'text-status-success border-status-success/30 bg-status-success/10' },
  CLOSED: { label: 'Ditutup', color: 'text-muted-foreground border-white/10 bg-white/5' },
} as const

export default function SupportPage() {
  const [cases, setCases] = useState<readonly SupportCase[] | null>(null)
  const [activeTab, setActiveTab] = useState<TabKey>('all')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    void apiJson('/api/support')
      .then((body) => {
        if (!cancelled) setCases((body as { cases: SupportCase[] }).cases)
      })
      .catch((cause: unknown) => {
        if (!cancelled) {
          setError(cause instanceof Error ? cause.message : 'Daftar tiket bantuan gagal dimuat.')
        }
      })
    return () => {
      cancelled = true
    }
  }, [])

  const counts = useMemo(
    () => ({
      all: cases?.length ?? 0,
      in_review: cases?.filter((c) => c.status === 'OPEN' || c.status === 'IN_REVIEW').length ?? 0,
      resolved: cases?.filter((c) => c.status === 'RESOLVED' || c.status === 'CLOSED').length ?? 0,
    }),
    [cases],
  )

  const filteredCases = useMemo(() => {
    if (!cases) return []
    if (activeTab === 'in_review') return cases.filter((c) => c.status === 'OPEN' || c.status === 'IN_REVIEW')
    if (activeTab === 'resolved') return cases.filter((c) => c.status === 'RESOLVED' || c.status === 'CLOSED')
    return cases
  }, [cases, activeTab])

  return (
    <main id="main-content" className="container-shell max-w-5xl space-y-8 py-8 sm:py-12">
      <header className="flex flex-col justify-between gap-4 border-b border-white/10 pb-6 sm:flex-row sm:items-end">
        <div>
          <span className="section-label">LAYANAN BANTUAN & DISPUTE</span>
          <h1 className="mt-2 font-display text-4xl sm:text-5xl">TIKET BANTUAN & SENGKETA</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Lacak status penanganan kendala transaksi, pelaporan double charge, dan investigasi tiket resmi.
          </p>
        </div>
        <Button asChild className="gap-2 rounded-xl font-bold">
          <Link href="/support/new">
            <Plus className="size-4" />
            Ajukan Laporan Baru
          </Link>
        </Button>
      </header>

      {error && <InlineAlert variant="error">{error}</InlineAlert>}

      {!cases ? (
        <LoadingState label="Memuat tiket bantuan Anda…" />
      ) : (
        <Tabs
          value={activeTab}
          onValueChange={(val) => setActiveTab(val as TabKey)}
          className="space-y-6"
        >
          <TabsList>
            <TabsTrigger value="all">Semua ({counts.all})</TabsTrigger>
            <TabsTrigger value="in_review">Sedang Diproses ({counts.in_review})</TabsTrigger>
            <TabsTrigger value="resolved">Selesai ({counts.resolved})</TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab}>
            {filteredCases.length === 0 ? (
              <div className="glass-panel flex flex-col items-center justify-center rounded-3xl p-12 text-center">
                <div className="flex size-14 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-war-gold">
                  <ShieldCheck className="size-7" />
                </div>
                <h3 className="mt-4 font-display text-2xl text-foreground">
                  Tidak Ada Tiket Aktif
                </h3>
                <p className="mt-1 max-w-sm text-xs text-muted-foreground">
                  Seluruh transaksi Anda berjalan normal tanpa sengketa yang sedang berlangsung.
                </p>
                <Button asChild variant="outline" size="sm" className="mt-5 rounded-xl border-white/10">
                  <Link href="/help">Buka Pusat Bantuan</Link>
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredCases.map((c) => {
                  const badge = statusBadges[c.status] ?? statusBadges.OPEN
                  return (
                    <article
                      key={c.id}
                      className="interactive-lift glass-panel space-y-3 rounded-2xl p-6"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="font-mono text-xs font-bold text-war-gold">
                          CASE #{c.id.slice(0, 8).toUpperCase()}
                        </span>
                        <span
                          className={`rounded-full border px-3 py-0.5 text-[10px] font-bold uppercase tracking-wider ${badge.color}`}
                        >
                          {badge.label}
                        </span>
                      </div>

                      <h2 className="font-display text-2xl text-foreground">{c.subject}</h2>

                      <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">
                        {c.description}
                      </p>

                      <div className="flex flex-wrap items-center justify-between gap-4 border-t border-white/8 pt-3 text-[11px] text-muted-foreground">
                        <div className="flex items-center gap-4">
                          <span className="flex items-center gap-1.5">
                            <Clock className="size-3.5" />
                            {new Date(c.created_at).toLocaleDateString('id-ID', {
                              day: 'numeric',
                              month: 'long',
                              year: 'numeric',
                            })}
                          </span>
                          {c.order_id && (
                            <span className="font-mono text-[10px]">
                              Order: {c.order_id.slice(0, 8)}…
                            </span>
                          )}
                        </div>

                        <span className="text-xs font-semibold text-war-gold hover:underline cursor-pointer">
                          Lihat Detail Kasus →
                        </span>
                      </div>
                    </article>
                  )
                })}
              </div>
            )}
          </TabsContent>
        </Tabs>
      )}
    </main>
  )
}
