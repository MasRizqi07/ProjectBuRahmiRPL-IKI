'use client'

import { use, useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { checkoutResponseSchema, createCheckoutRequestSchema, reservationDetailResponseSchema, type CheckoutResponse, type ReservationDetailResponse } from '@war-ticket/contracts'
import { BuyerDetailsForm, type BuyerFormValues } from '@/components/checkout/buyer-details-form'
import { CheckoutProgress } from '@/components/checkout/checkout-progress'
import { PaymentSummary } from '@/components/checkout/payment-summary'
import { InlineAlert } from '@/components/feedback/inline-alert'
import { LoadingState } from '@/components/feedback/loading-state'
import { PageShell } from '@/components/layout/page-shell'
import { apiJson } from '@/lib/client/api'
import { formatIDR } from '@/lib/utils/format'

interface PaymentPageProps { readonly searchParams: Promise<{ reservationId?: string }> }
const initialBuyer: BuyerFormValues = { fullName: '', email: '', phone: '', nik: '' }
const remainingSeconds = (expiresAt: string): number => Math.max(0, Math.ceil((new Date(expiresAt).getTime() - Date.now()) / 1_000))

export default function PaymentPage({ searchParams }: PaymentPageProps) {
  const { reservationId } = use(searchParams)
  const router = useRouter()
  const paymentTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [reservation, setReservation] = useState<ReservationDetailResponse | null>(null)
  const [seconds, setSeconds] = useState(0)
  const [buyer, setBuyer] = useState<BuyerFormValues>(initialBuyer)
  const [nikConsent, setNikConsent] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!reservationId) { setError('Reservation tidak ditemukan.'); return }
    let cancelled = false
    void apiJson(`/api/reservations/${reservationId}`)
      .then((body) => {
        const parsed = reservationDetailResponseSchema.parse(body)
        if (!cancelled) { setReservation(parsed); setSeconds(remainingSeconds(parsed.expiresAt)) }
      })
      .catch((cause: unknown) => { if (!cancelled) setError(cause instanceof Error ? cause.message : 'Reservation gagal dimuat.') })
    return () => { cancelled = true }
  }, [reservationId])

  useEffect(() => {
    if (!reservation) return
    const timer = setInterval(() => setSeconds(remainingSeconds(reservation.expiresAt)), 1_000)
    return () => clearInterval(timer)
  }, [reservation])

  useEffect(() => () => {
    if (paymentTimer.current) clearTimeout(paymentTimer.current)
  }, [])

  const handlePaymentError = (cause: unknown): void => {
    setError(cause instanceof Error ? cause.message : 'Status pembayaran gagal diperiksa.')
    setSubmitting(false)
  }

  const continuePayment = (checkout: CheckoutResponse): void => {
    if (checkout.orderStatus === 'PAID') { router.replace(`/order-confirmation?orderId=${checkout.orderId}`); return }
    if (checkout.redirectUrl) { window.location.assign(checkout.redirectUrl); return }
    if (checkout.retryAfterMs === null) { handlePaymentError(new Error('Sesi pembayaran belum tersedia. Silakan coba kembali.')); return }
    paymentTimer.current = setTimeout(() => {
      void apiJson(`/api/orders/${checkout.orderId}`)
        .then((body) => continuePayment(checkoutResponseSchema.parse(body)))
        .catch(handlePaymentError)
    }, checkout.retryAfterMs)
  }

  const submit = async (event: React.FormEvent): Promise<void> => {
    event.preventDefault()
    if (!reservationId || !reservation || seconds === 0) return
    const candidate = { reservationId, buyer: { fullName: buyer.fullName, email: buyer.email, phone: buyer.phone, ...(buyer.nik ? { nik: buyer.nik, consentToStoreNik: nikConsent } : {}) } }
    const validated = createCheckoutRequestSchema.safeParse(candidate)
    if (!validated.success) { setError(validated.error.issues[0]?.message ?? 'Data pembeli belum valid.'); return }

    const storageKey = `checkout-idempotency:${reservationId}`
    const idempotencyKey = sessionStorage.getItem(storageKey) ?? crypto.randomUUID()
    sessionStorage.setItem(storageKey, idempotencyKey)
    setSubmitting(true)
    setError(null)
    try {
      const body = await apiJson('/api/orders', { method: 'POST', headers: { 'idempotency-key': idempotencyKey }, body: JSON.stringify(validated.data) })
      continuePayment(checkoutResponseSchema.parse(body))
    } catch (cause) { handlePaymentError(cause) }
  }

  return (
    <PageShell eyebrow="Checkout aman" title="Selesaikan pesanan" description="Hold inventori memiliki batas waktu. Lengkapi data untuk melanjutkan ke Midtrans.">
      <CheckoutProgress current={3} />
      {error && <InlineAlert variant="error" className="mb-6">{error}</InlineAlert>}
      {!reservation ? <LoadingState label="Memuat reservation…" /> : (
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_360px]">
          <BuyerDetailsForm values={buyer} nikConsent={nikConsent} submitting={submitting} expired={seconds === 0} totalLabel={formatIDR(reservation.total)} onChange={(field, value) => setBuyer((current) => ({ ...current, [field]: value }))} onConsentChange={setNikConsent} onSubmit={(event) => void submit(event)} />
          <PaymentSummary reservation={reservation} seconds={seconds} />
        </div>
      )}
    </PageShell>
  )
}
