'use client'

import { use, useEffect, useState } from 'react'
import Link from 'next/link'
import { CheckCircle2, Clock3, Home, TicketCheck } from 'lucide-react'
import { checkoutResponseSchema, type CheckoutResponse } from '@war-ticket/contracts'
import { CheckoutProgress } from '@/components/checkout/checkout-progress'
import { CapabilityNotice } from '@/components/feedback/capability-notice'
import { InlineAlert } from '@/components/feedback/inline-alert'
import { LoadingState } from '@/components/feedback/loading-state'
import { PageShell } from '@/components/layout/page-shell'
import { Button } from '@/components/ui/button'
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
      setError('Order ID tidak ditemukan. Buka halaman ini dari alur checkout yang valid.')
      return
    }
    let cancelled = false
    let timer: ReturnType<typeof setTimeout> | undefined
    const verify = async (): Promise<void> => {
      try {
        const next = checkoutResponseSchema.parse(await apiJson(`/api/orders/${orderId}`))
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

  return (
    <PageShell
      eyebrow="KONFIRMASI PEMBAYARAN"
      title={paid ? 'Pembayaran Berhasil Diverifikasi' : 'Memverifikasi Pembayaran'}
      description={
        paid
          ? 'Status pembayaran telah dikonfirmasi oleh server. Penerbitan e-ticket akan tersedia setelah integrasi ticket issuance selesai.'
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
                  Order ID: <strong className="font-mono text-war-gold">{checkout.orderId}</strong>
                </p>
              </div>
            </div>
            <span className="hidden text-xs font-semibold text-status-success sm:block">Status server: PAID</span>
          </div>

          <CapabilityNotice capability="ticketDocumentActions" />

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
