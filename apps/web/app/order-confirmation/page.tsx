'use client'

import { use, useEffect, useState } from 'react'
import Link from 'next/link'
import { CheckCircle2, Clock3, ShieldCheck, TicketCheck } from 'lucide-react'
import { checkoutResponseSchema, type CheckoutResponse } from '@war-ticket/contracts'
import { CheckoutProgress } from '@/components/checkout/checkout-progress'
import { InlineAlert } from '@/components/feedback/inline-alert'
import { LoadingState } from '@/components/feedback/loading-state'
import { PageShell } from '@/components/layout/page-shell'
import { Button } from '@/components/ui/button'
import { apiJson } from '@/lib/client/api'

interface ConfirmationProps { readonly searchParams: Promise<{ orderId?: string }> }

export default function OrderConfirmationPage({ searchParams }: ConfirmationProps) {
  const { orderId } = use(searchParams)
  const [checkout, setCheckout] = useState<CheckoutResponse | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!orderId) { setError('Order ID tidak ditemukan.'); return }
    let cancelled = false
    let timer: ReturnType<typeof setTimeout> | undefined
    const verify = async (): Promise<void> => {
      try {
        const next = checkoutResponseSchema.parse(await apiJson(`/api/v1/orders/${orderId}/payment`))
        if (cancelled) return
        setCheckout(next)
        setError(null)
        if (next.orderStatus !== 'PAID' && next.retryAfterMs) timer = setTimeout(() => void verify(), next.retryAfterMs)
      } catch (cause) {
        if (!cancelled) setError(cause instanceof Error ? cause.message : 'Status pesanan gagal diverifikasi.')
      }
    }
    void verify()
    return () => { cancelled = true; if (timer) clearTimeout(timer) }
  }, [orderId])

  const paid = checkout?.orderStatus === 'PAID'
  return (
    <PageShell eyebrow="Status pesanan" title={paid ? 'Pembayaran berhasil' : 'Memverifikasi pembayaran'} description={paid ? 'Pesanan telah dikonfirmasi oleh server. Simpan Order ID untuk referensi.' : 'Kami sedang mencocokkan status terbaru dari payment provider.'} className="max-w-4xl">
      <CheckoutProgress current={paid ? 4 : 3} />
      {error ? <InlineAlert variant="error">{error}</InlineAlert> : !checkout ? <LoadingState label="Memverifikasi status pembayaran…" /> : (
        <section className="glass-panel relative overflow-hidden rounded-3xl p-6 text-center sm:p-10">
          <div className="absolute inset-0 grid-pattern opacity-25" />
          <div className="relative">
            <div className={`mx-auto grid size-20 place-items-center rounded-full border ${paid ? 'border-status-success/30 bg-status-success/10 text-status-success' : 'border-war-gold/30 bg-war-gold/10 text-war-gold'}`}>
              {paid ? <CheckCircle2 className="size-10" /> : <Clock3 className="size-9 animate-pulse" />}
            </div>
            <h2 className="mt-6 font-display text-4xl tracking-wide sm:text-5xl">{paid ? 'Tiket berhasil diamankan' : 'Status sedang diproses'}</h2>
            <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-muted-foreground">{paid ? 'Detail tiket tersedia melalui akun Anda. Informasi event yang ditampilkan berasal dari data pesanan, bukan placeholder.' : `Status order: ${checkout.orderStatus.replaceAll('_', ' ').toLowerCase()}.`}</p>
            <div className="mx-auto mt-7 max-w-lg rounded-2xl border border-dashed border-white/12 bg-black/20 p-5 text-left">
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Order ID</p>
              <p className="mt-2 break-all font-mono text-sm font-bold text-war-gold">{checkout.orderId}</p>
              <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground"><ShieldCheck className="size-4 text-status-success" />Status diverifikasi melalui API checkout.</div>
            </div>
            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
              <Button asChild size="lg" className="rounded-xl font-bold"><Link href="/my-tickets"><TicketCheck /> Lihat tiket saya</Link></Button>
              <Button asChild size="lg" variant="outline" className="rounded-xl font-bold"><Link href="/concerts">Jelajahi konser</Link></Button>
            </div>
          </div>
        </section>
      )}
    </PageShell>
  )
}
