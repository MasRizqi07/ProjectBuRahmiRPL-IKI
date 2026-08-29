'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import {
  Activity,
  Check,
  Cpu,
  FileClock,
  Radio,
  ShieldAlert,
  Ticket,
  Users,
  X,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { InlineAlert } from '@/components/feedback/inline-alert'
import { LoadingState } from '@/components/feedback/loading-state'
import { DesignBackdrop } from '@/components/ui/design-backdrop'
import { apiJson } from '@/lib/client/api'
import { formatIDR } from '@/lib/utils/format'

interface Metrics {
  readonly users: number
  readonly events: number
  readonly paid_orders: number
  readonly gross_volume: number
  readonly open_disputes: number
}

interface AdminEvent {
  readonly id: string
  readonly title: string
  readonly starts_at: string
  readonly approval_status: string
}

export default function AdminDashboardPage() {
  const [metrics, setMetrics] = useState<Metrics | null>(null)
  const [events, setEvents] = useState<readonly AdminEvent[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async (): Promise<void> => {
    try {
      const [nextMetrics, nextEvents] = await Promise.all([
        apiJson('/api/admin/metrics'),
        apiJson('/api/admin/events'),
      ])
      setMetrics(nextMetrics as Metrics)
      setEvents((nextEvents as { events: AdminEvent[] }).events)
      setError(null)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Admin data gagal dimuat.')
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const transition = async (
    eventId: string,
    action: 'APPROVE' | 'REJECT' | 'PUBLISH' | 'CANCEL',
  ): Promise<void> => {
    try {
      await apiJson('/api/admin/events', {
        method: 'PATCH',
        body: JSON.stringify({
          eventId,
          action,
          ...(action === 'REJECT'
            ? {
                reason:
                  window.prompt('Alasan penolakan') ?? 'Ditolak oleh admin',
              }
            : {}),
        }),
      })
      await load()
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Transisi event gagal.')
    }
  }

  return (
    <main id="main-content" className="container-shell space-y-8 py-8 sm:py-10">
      <section className="relative overflow-hidden rounded-3xl border border-white/10 p-8 sm:p-10">
        <DesignBackdrop
          group="war_ticket_platform_admin_dashboard"
          index={0}
          imageClassName="opacity-25"
          overlayClassName="bg-black/85"
        />
        <div className="relative z-10">
          <span className="section-label">PLATFORM ADMIN</span>
          <h1 className="mt-2 font-display text-4xl sm:text-5xl">PLATFORM GOVERNANCE</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Pusat kendali operasional, verifikasi promotor, audit kepatuhan, dan resolusi sengketa.
          </p>
        </div>
      </section>

      {error && <InlineAlert variant="error">{error}</InlineAlert>}

      {!metrics || !events ? (
        <LoadingState label="Memuat metrik platform global…" />
      ) : (
        <>
          {/* Global Platform Telemetry */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            <div className="glass-panel rounded-2xl p-5">
              <div className="flex items-center justify-between text-muted-foreground">
                <span className="text-[10px] font-bold uppercase tracking-wider">Total Event</span>
                <Radio className="size-4 text-war-gold" />
              </div>
              <p className="mt-3 font-display text-3xl text-foreground">{metrics.events}</p>
              <p className="mt-1 text-[11px] text-status-success">Event terdaftar di platform</p>
            </div>

            <div className="glass-panel rounded-2xl p-5">
              <div className="flex items-center justify-between text-muted-foreground">
                <span className="text-[10px] font-bold uppercase tracking-wider">Tiket Terbayar</span>
                <Ticket className="size-4 text-war-gold" />
              </div>
              <p className="mt-3 font-display text-3xl text-foreground">
                {metrics.paid_orders.toLocaleString('id-ID')}
              </p>
              <p className="mt-1 text-[11px] text-muted-foreground">Transaksi tervalidasi</p>
            </div>

            <div className="glass-panel rounded-2xl p-5">
              <div className="flex items-center justify-between text-muted-foreground">
                <span className="text-[10px] font-bold uppercase tracking-wider">Gross Volume (GMV)</span>
                <Activity className="size-4 text-status-success" />
              </div>
              <p className="mt-3 font-mono text-xl font-bold text-war-gold-bright sm:text-2xl">
                {formatIDR(metrics.gross_volume)}
              </p>
              <p className="mt-1 text-[11px] text-muted-foreground">Volume transaksi total</p>
            </div>

            <div className="glass-panel rounded-2xl p-5">
              <div className="flex items-center justify-between text-muted-foreground">
                <span className="text-[10px] font-bold uppercase tracking-wider">Pengguna Terdaftar</span>
                <Users className="size-4 text-tertiary-container" />
              </div>
              <p className="mt-3 font-display text-3xl text-foreground">
                {metrics.users.toLocaleString('id-ID')}
              </p>
              <p className="mt-1 text-[11px] text-muted-foreground">Akun aktif</p>
            </div>

            <div className="glass-panel rounded-2xl p-5">
              <div className="flex items-center justify-between text-muted-foreground">
                <span className="text-[10px] font-bold uppercase tracking-wider">Infrastruktur Load</span>
                <Cpu className="size-4 text-muted-foreground" />
              </div>
              <p className="mt-3 font-mono text-sm font-semibold text-muted-foreground">
                Observability Pending
              </p>
              <p className="mt-1 text-[10px] text-muted-foreground">Integrasi pipeline sistem</p>
            </div>
          </div>

          {/* Quick Actions & Navigation */}
          <div className="flex flex-wrap gap-3">
            <Button asChild variant="outline" className="rounded-xl border-white/10">
              <Link href="/admin/disputes" className="flex items-center gap-2">
                <ShieldAlert className="size-4 text-destructive" />
                Sengketa & Refund ({metrics.open_disputes})
              </Link>
            </Button>
            <Button asChild variant="outline" className="rounded-xl border-white/10">
              <Link href="/admin/audit-logs" className="flex items-center gap-2">
                <FileClock className="size-4 text-war-gold" />
                Audit Trail Log
              </Link>
            </Button>
          </div>

          {/* Event Approval Workflow */}
          <section className="space-y-4">
            <h2 className="font-display text-3xl">Persetujuan & Moderasi Event</h2>
            {events.length === 0 ? (
              <div className="glass-panel rounded-2xl p-8 text-center text-sm text-muted-foreground">
                Tidak ada antrean event yang memerlukan peninjauan saat ini.
              </div>
            ) : (
              <div className="space-y-3">
                {events.map((event) => (
                  <article
                    key={event.id}
                    className="glass-panel flex flex-col justify-between gap-4 rounded-2xl p-5 sm:flex-row sm:items-center"
                  >
                    <div>
                      <span className="rounded-full border border-war-gold/30 bg-war-gold/10 px-2.5 py-0.5 text-[10px] font-black text-war-gold-bright uppercase">
                        {event.approval_status}
                      </span>
                      <h3 className="mt-2 font-display text-2xl text-foreground">{event.title}</h3>
                      <p className="text-xs text-muted-foreground">
                        Jadwal: {new Date(event.starts_at).toLocaleString('id-ID')}
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {event.approval_status === 'SUBMITTED' && (
                        <>
                          <Button
                            onClick={() => void transition(event.id, 'APPROVE')}
                            size="sm"
                            className="gap-1.5 rounded-xl font-bold"
                          >
                            <Check className="size-4" />
                            Setujui
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => void transition(event.id, 'REJECT')}
                            className="gap-1.5 rounded-xl font-bold"
                          >
                            <X className="size-4" />
                            Tolak
                          </Button>
                        </>
                      )}
                      {event.approval_status === 'APPROVED' && (
                        <Button
                          onClick={() => void transition(event.id, 'PUBLISH')}
                          size="sm"
                          className="rounded-xl font-bold"
                        >
                          Publikasikan
                        </Button>
                      )}
                      {event.approval_status === 'PUBLISHED' && (
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => void transition(event.id, 'CANCEL')}
                          className="rounded-xl font-bold"
                        >
                          Batalkan Event
                        </Button>
                      )}
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        </>
      )}
    </main>
  )
}
