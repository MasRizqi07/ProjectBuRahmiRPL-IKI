'use client'

import { use, useState } from 'react'
import { CheckCircle2, Minus, Plus } from 'lucide-react'
import { holdCreatedResponseSchema } from '@/lib/serverless-ticketing/contracts'
import type { HoldCreatedResponse } from '@/lib/serverless-ticketing/contracts'
import { apiJson } from '@/lib/client/api'
import { CheckoutProgress } from '@/components/checkout/checkout-progress'
import { InlineAlert } from '@/components/feedback/inline-alert'
import { PageShell } from '@/components/layout/page-shell'
import { Button } from '@/components/ui/button'
import { formatIDR } from '@/lib/utils/format'

interface EdgeCheckoutProps {
  readonly searchParams: Promise<{ eventId?: string; tierId?: string }>
}

export default function EdgeCheckoutPage({ searchParams }: EdgeCheckoutProps) {
  const { eventId, tierId } = use(searchParams)
  const [quantity, setQuantity] = useState(1)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [hold, setHold] = useState<HoldCreatedResponse | null>(null)

  const reserve = async (): Promise<void> => {
    if (!eventId) {
      setError('Event tidak ditemukan.')
      return
    }
    const storageKey = `edge-reserve-idempotency:${eventId}:${tierId ?? 'default'}`
    const idempotencyKey = sessionStorage.getItem(storageKey) ?? crypto.randomUUID()
    sessionStorage.setItem(storageKey, idempotencyKey)
    setSubmitting(true)
    setError(null)
    try {
      const body = await apiJson(`/api/events/${eventId}/reserve`, {
        method: 'POST',
        headers: { 'idempotency-key': idempotencyKey },
        body: JSON.stringify({ qty: quantity, ...(tierId ? { tierId } : {}) }),
      })
      setHold(holdCreatedResponseSchema.parse(body))
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Tiket gagal diamankan.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <PageShell
      eyebrow="Serverless checkout"
      title="Amankan tiket"
      description="Stok dan hold diputuskan secara atomik oleh Redis. Maksimal empat tiket per order."
      className="max-w-3xl"
    >
      <CheckoutProgress current={2} />
      {error && <InlineAlert variant="error" className="mb-5">{error}</InlineAlert>}
      {hold ? (
        <section className="glass-panel rounded-3xl p-7 text-center">
          <CheckCircle2 className="mx-auto size-12 text-status-success" />
          <h2 className="mt-4 font-display text-4xl">Hold berhasil dibuat</h2>
          <p className="mt-3 text-sm text-muted-foreground">
            {hold.quantity} × {hold.tierName} · {formatIDR(hold.total)}
          </p>
          <p className="mt-4 break-all font-mono text-xs text-war-gold">{hold.orderId}</p>
          <InlineAlert className="mt-6">
            Hold berlaku sampai {new Date(hold.holdExpiresAt).toLocaleTimeString('id-ID')}.
            Payment handoff memakai provider order ID yang tersimpan pada order ini.
          </InlineAlert>
        </section>
      ) : (
        <section className="glass-panel rounded-3xl p-7">
          <p className="text-sm text-muted-foreground">Jumlah tiket</p>
          <div className="mt-4 flex items-center justify-between rounded-2xl border border-white/10 p-4">
            <Button variant="outline" size="icon" onClick={() => setQuantity((value) => Math.max(1, value - 1))} disabled={quantity === 1}><Minus /></Button>
            <span className="font-mono text-3xl font-bold">{quantity}</span>
            <Button variant="outline" size="icon" onClick={() => setQuantity((value) => Math.min(4, value + 1))} disabled={quantity === 4}><Plus /></Button>
          </div>
          <Button className="mt-6 w-full rounded-xl" size="lg" disabled={submitting || !eventId} onClick={() => void reserve()}>
            {submitting ? 'Mengunci stok…' : 'Amankan tiket'}
          </Button>
        </section>
      )}
    </PageShell>
  )
}
