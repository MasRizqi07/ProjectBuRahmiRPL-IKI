'use client'

import Image from 'next/image'
import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import {
  ArrowRight,
  Calendar,
  Download,
  QrCode,
  Search,
  Share2,
  Ticket,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { InlineAlert } from '@/components/feedback/inline-alert'
import { LoadingState } from '@/components/feedback/loading-state'
import { apiJson } from '@/lib/client/api'
import { formatIDR } from '@/lib/utils/format'

interface BuyerTicket {
  readonly id: string
  readonly orderId: string
  readonly ticketCode: string
  readonly status: 'ACTIVE' | 'REDEEMED' | 'VOID' | 'REFUNDED'
  readonly eventTitle: string
  readonly startsAt: string
  readonly label: string
  readonly price: number
}

interface QrView {
  readonly imageDataUrl: string
  readonly expiresAt: string
}
type TicketTab = 'upcoming' | 'completed' | 'cancelled'

function ticketTab(ticket: BuyerTicket): TicketTab {
  if (ticket.status === 'VOID' || ticket.status === 'REFUNDED') return 'cancelled'
  return ticket.status === 'REDEEMED' || new Date(ticket.startsAt).getTime() < Date.now()
    ? 'completed'
    : 'upcoming'
}

export default function MyTicketsPage() {
  const [tickets, setTickets] = useState<readonly BuyerTicket[] | null>(null)
  const [activeTab, setActiveTab] = useState<TicketTab>('upcoming')
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<BuyerTicket | null>(null)
  const [qr, setQr] = useState<QrView | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    void apiJson('/api/me/tickets')
      .then((body) => {
        if (!cancelled) setTickets((body as { tickets: BuyerTicket[] }).tickets)
      })
      .catch((cause: unknown) => {
        if (!cancelled) {
          setError(cause instanceof Error ? cause.message : 'Tiket gagal dimuat.')
        }
      })
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (!selected || selected.status !== 'ACTIVE') {
      setQr(null)
      return
    }
    let cancelled = false
    let timer: ReturnType<typeof setTimeout> | undefined
    const refresh = async (): Promise<void> => {
      try {
        const next = (await apiJson(`/api/tickets/${selected.id}/qr`, {
          method: 'POST',
        })) as QrView
        if (!cancelled) {
          setQr(next)
          setError(null)
          timer = setTimeout(() => void refresh(), 30_000)
        }
      } catch (cause) {
        if (!cancelled) {
          setError(cause instanceof Error ? cause.message : 'QR dinamis belum tersedia.')
        }
      }
    }
    void refresh()
    return () => {
      cancelled = true
      if (timer) clearTimeout(timer)
    }
  }, [selected])

  const counts = useMemo(
    () => ({
      upcoming: tickets?.filter((ticket) => ticketTab(ticket) === 'upcoming').length ?? 0,
      completed: tickets?.filter((ticket) => ticketTab(ticket) === 'completed').length ?? 0,
      cancelled: tickets?.filter((ticket) => ticketTab(ticket) === 'cancelled').length ?? 0,
    }),
    [tickets],
  )

  const getFilteredTickets = (tab: TicketTab) =>
    (tickets ?? []).filter(
      (ticket) =>
        ticketTab(ticket) === tab &&
        `${ticket.eventTitle} ${ticket.ticketCode} ${ticket.orderId}`
          .toLowerCase()
          .includes(search.toLowerCase()),
    )

  const share = async (ticket: BuyerTicket): Promise<void> => {
    const url = `${window.location.origin}/my-tickets?ticket=${ticket.id}`
    if (navigator.share) {
      await navigator.share({
        title: ticket.eventTitle,
        text: `E-ticket ${ticket.ticketCode}`,
        url,
      })
    } else {
      await navigator.clipboard.writeText(url)
    }
  }

  const emptyMessages = {
    upcoming: {
      title: 'Belum ada tiket mendatang',
      description: 'Siap ikutan war tiket konser berikutnya? Cek panggung terbaru sekarang.',
      cta: 'Cari Konser',
      href: '/concerts',
    },
    completed: {
      title: 'Belum ada riwayat konser',
      description: 'Konser yang sudah kamu hadiri akan tercatat rapi di sini.',
      cta: 'Temukan Event',
      href: '/concerts',
    },
    cancelled: {
      title: 'Tidak ada tiket dibatalkan',
      description: 'Semua tiket yang dibatalkan atau direfund akan tampil di sini.',
      cta: 'Pusat Bantuan',
      href: '/help',
    },
  }

  return (
    <main id="main-content" className="container-shell space-y-8 py-8 sm:py-12">
      <header className="flex flex-col justify-between gap-4 border-b border-white/10 pb-6 md:flex-row md:items-end">
        <div>
          <span className="section-label">USER PORTAL</span>
          <h1 className="mt-2 font-display text-4xl sm:text-5xl">TIKET & RIWAYAT</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Data langsung dari order terverifikasi; QR masuk dinamis dengan validasi anti-replay.
          </p>
        </div>
        <Button asChild variant="outline">
          <Link href="/concerts">
            Cari konser <ArrowRight className="size-4" />
          </Link>
        </Button>
      </header>

      {error && <InlineAlert variant="error">{error}</InlineAlert>}

      {!tickets ? (
        <LoadingState label="Memuat tiket resmi…" />
      ) : (
        <Tabs
          value={activeTab}
          onValueChange={(val) => setActiveTab(val as TicketTab)}
          className="space-y-6"
        >
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <TabsList>
              <TabsTrigger value="upcoming">
                Tiket Mendatang ({counts.upcoming})
              </TabsTrigger>
              <TabsTrigger value="completed">
                Riwayat Konser ({counts.completed})
              </TabsTrigger>
              <TabsTrigger value="cancelled">
                Dibatalkan ({counts.cancelled})
              </TabsTrigger>
            </TabsList>

            <label className="relative">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Cari artis atau kode tiket…"
                className="rounded-xl border border-white/10 bg-white/5 py-2 pl-9 pr-4 text-xs focus:border-war-gold/50 focus:outline-none"
              />
            </label>
          </div>

          {(['upcoming', 'completed', 'cancelled'] as const).map((tab) => {
            const list = getFilteredTickets(tab)
            const empty = emptyMessages[tab]

            return (
              <TabsContent key={tab} value={tab} className="mt-4">
                {list.length === 0 ? (
                  <div className="glass-panel flex flex-col items-center justify-center rounded-3xl p-12 text-center">
                    <div className="flex size-14 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-war-gold">
                      <Ticket className="size-7" />
                    </div>
                    <h3 className="mt-4 font-display text-2xl text-foreground">
                      {empty.title}
                    </h3>
                    <p className="mt-1 max-w-sm text-xs text-muted-foreground">
                      {empty.description}
                    </p>
                    <Button asChild variant="outline" size="sm" className="mt-5 rounded-xl">
                      <Link href={empty.href}>{empty.cta}</Link>
                    </Button>
                  </div>
                ) : (
                  <div className="grid gap-5 md:grid-cols-2">
                    {list.map((ticket) => (
                      <article
                        key={ticket.id}
                        className="interactive-lift glass-panel overflow-hidden rounded-2xl p-6"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-mono text-xs font-bold text-war-gold">
                            {ticket.ticketCode}
                          </span>
                          <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-0.5 text-[10px] font-bold text-muted-foreground uppercase">
                            {ticket.status}
                          </span>
                        </div>

                        <h2 className="mt-3 font-display text-2xl tracking-wide text-foreground">
                          {ticket.eventTitle}
                        </h2>

                        <div className="mt-3 space-y-1.5 text-xs text-muted-foreground">
                          <p className="flex items-center gap-2">
                            <Calendar className="size-3.5 text-war-gold" />
                            {new Date(ticket.startsAt).toLocaleString('id-ID', {
                              day: 'numeric',
                              month: 'long',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </p>
                          <p className="font-medium text-foreground/80">{ticket.label}</p>
                        </div>

                        <div className="mt-4 flex items-end justify-between border-t border-white/8 pt-4">
                          <div>
                            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                              Harga Tiket
                            </p>
                            <p className="font-mono text-base font-bold text-war-gold">
                              {formatIDR(ticket.price)}
                            </p>
                          </div>

                          <div className="flex gap-2">
                            <Button
                              onClick={() => setSelected(ticket)}
                              disabled={ticket.status !== 'ACTIVE'}
                              size="sm"
                              className="h-9 gap-1.5 rounded-xl font-bold"
                            >
                              <QrCode className="size-4" />
                              Buka QR
                            </Button>
                            <Button asChild variant="outline" size="sm" className="h-9 w-9 p-0 rounded-xl" title="Unduh Tiket">
                              <a href={`/api/tickets/${ticket.id}/document`}>
                                <Download className="size-4" />
                              </a>
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-9 w-9 p-0 rounded-xl"
                              onClick={() => void share(ticket)}
                              title="Bagikan"
                            >
                              <Share2 className="size-4" />
                            </Button>
                          </div>
                        </div>
                      </article>
                    ))}
                  </div>
                )}
              </TabsContent>
            )
          })}
        </Tabs>
      )}

      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 backdrop-blur-xl">
          <section className="w-full max-w-md rounded-3xl border border-war-gold/30 bg-[#121211] p-6 text-center shadow-2xl">
            <button
              onClick={() => setSelected(null)}
              className="float-right text-muted-foreground hover:text-foreground"
              aria-label="Tutup"
            >
              ✕
            </button>
            <h2 className="font-display text-3xl">QR MASUK DINAMIS</h2>
            <p className="mt-1 font-mono text-xs text-war-gold">{selected.ticketCode}</p>
            {qr ? (
              <>
                <Image
                  src={qr.imageDataUrl}
                  alt={`QR masuk ${selected.eventTitle}`}
                  width={280}
                  height={280}
                  unoptimized
                  className="mx-auto mt-5 rounded-2xl bg-white p-3 shadow-inner"
                />
                <p className="mt-3 text-xs text-muted-foreground">
                  Berlaku sampai {new Date(qr.expiresAt).toLocaleTimeString('id-ID')}
                </p>
              </>
            ) : (
              <div className="my-12">
                <LoadingState label="Menerbitkan QR dinamis aman…" />
              </div>
            )}
          </section>
        </div>
      )}
    </main>
  )
}
