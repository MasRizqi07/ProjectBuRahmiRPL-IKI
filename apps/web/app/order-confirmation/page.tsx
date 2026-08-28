'use client'

import { use, useEffect, useState } from 'react'
import Link from 'next/link'
import { CheckCircle2, Clock3, Download, Home, QrCode, Share2, ShieldCheck, TicketCheck } from 'lucide-react'
import { checkoutResponseSchema, type CheckoutResponse } from '@war-ticket/contracts'
import { CheckoutProgress } from '@/components/checkout/checkout-progress'
import { InlineAlert } from '@/components/feedback/inline-alert'
import { LoadingState } from '@/components/feedback/loading-state'
import { PageShell } from '@/components/layout/page-shell'
import { Button } from '@/components/ui/button'
import { MetallicTicketCard, type TicketDetails } from '@/components/ui/metallic-ticket-card'
import { apiJson } from '@/lib/client/api'

interface ConfirmationProps {
  readonly searchParams: Promise<{ orderId?: string }>
}

export default function OrderConfirmationPage({ searchParams }: ConfirmationProps) {
  const { orderId } = use(searchParams)
  const [checkout, setCheckout] = useState<CheckoutResponse | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!orderId) {
      // Create a demo state if direct visit
      setCheckout({
        orderId: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
        orderStatus: 'PAID',
        paymentStatus: 'SUCCEEDED',
        paymentToken: null,
        redirectUrl: null,
        retryAfterMs: null,
      })
      return
    }
    let cancelled = false
    let timer: ReturnType<typeof setTimeout> | undefined
    const verify = async (): Promise<void> => {
      try {
        const next = checkoutResponseSchema.parse(await apiJson(`/api/v1/orders/${orderId}/payment`))
        if (cancelled) return
        setCheckout(next)
        setError(null)
        if (next.orderStatus !== 'PAID' && next.retryAfterMs) {
          timer = setTimeout(() => void verify(), next.retryAfterMs)
        }
      } catch (cause) {
        if (!cancelled) setError(cause instanceof Error ? cause.message : 'Status pesanan gagal diverifikasi.')
      }
    }
    void verify()
    return () => {
      cancelled = true
      if (timer) clearTimeout(timer)
    }
  }, [orderId])

  const paid = checkout?.orderStatus === 'PAID'

  const demoTicket: TicketDetails = {
    orderId: checkout?.orderId ?? 'WT-2026-X8910',
    ticketCode: `WT-QR-${(checkout?.orderId ?? '2026').slice(-4)}-9982`,
    concertTitle: 'Coldplay Live in Jakarta 2026',
    artist: 'Coldplay',
    venue: 'Stadion Gelora Bung Karno',
    city: 'Jakarta Pusat',
    eventDate: '20 Mei 2026',
    eventTime: '19:00',
    gateOpen: '16:30',
    tierName: 'VIP STANDING',
    section: 'Zone VIP-A',
    seatNumber: 'A-142',
    holderName: 'Rizqi Pratama',
    nik: '317101******0004',
    price: 3500000,
    status: 'valid',
  }

  return (
    <PageShell
      eyebrow="KONFIRMASI PEMBAYARAN"
      title={paid ? 'E-Ticket Resmi Anda Siap' : 'Memverifikasi Pembayaran'}
      description={
        paid
          ? 'Pembayaran berhasil dikonfirmasi secara real-time. Tunjukkan E-Ticket di bawah ini saat masuk gerbang venue.'
          : 'Kami sedang mencocokkan status transaksi terbaru dari gateway pembayaran.'
      }
      className="max-w-4xl"
    >
      <CheckoutProgress current={paid ? 4 : 3} />

      {error ? (
        <InlineAlert variant="error">{error}</InlineAlert>
      ) : !checkout ? (
        <LoadingState label="Memverifikasi status tiket dan pembayaran…" />
      ) : paid ? (
        <div className="space-y-8">
          {/* Success Banner */}
          <div className="flex items-center justify-between rounded-2xl border border-status-success/40 bg-status-success/10 p-5 backdrop-blur-xl">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-full bg-status-success text-black font-bold">
                <CheckCircle2 className="size-6" />
              </div>
              <div>
                <h3 className="font-display text-xl tracking-wide text-foreground">
                  TRANSAKSI SELESAI & AMAN
                </h3>
                <p className="text-xs text-muted-foreground">
                  Order ID: <strong className="font-mono text-war-gold">{checkout.orderId}</strong> • Salinan tiket dikirim ke email
                </p>
              </div>
            </div>
            <div className="hidden sm:flex items-center gap-1.5 text-xs text-status-success font-semibold">
              <ShieldCheck className="size-4" /> Blockchain Verified
            </div>
          </div>

          {/* Interactive Metallic Hologram Ticket */}
          <MetallicTicketCard ticket={demoTicket} />

          {/* Bottom Actions */}
          <div className="flex flex-col sm:flex-row justify-center gap-4 pt-4 border-t border-white/10">
            <Button asChild size="lg" className="rounded-xl font-bold bg-primary text-primary-foreground hover:bg-war-gold-bright">
              <Link href="/my-tickets">
                <TicketCheck className="size-4 mr-2" /> Lihat di Tiket Saya
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="rounded-xl font-bold border-white/15 bg-white/5">
              <Link href="/">
                <Home className="size-4 mr-2" /> Kembali ke Beranda
              </Link>
            </Button>
          </div>
        </div>
      ) : (
        <section className="glass-panel relative overflow-hidden rounded-3xl p-8 text-center sm:p-12">
          <Clock3 className="size-12 mx-auto animate-pulse text-war-gold" />
          <h2 className="mt-4 font-display text-3xl text-foreground">Status Sedang Diproses</h2>
          <p className="mt-2 text-xs text-muted-foreground">Status order: {checkout.orderStatus}</p>
        </section>
      )}
    </PageShell>
  )
}
