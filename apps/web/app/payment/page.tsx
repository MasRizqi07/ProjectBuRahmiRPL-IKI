'use client'

import { use, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  checkoutResponseSchema,
  createCheckoutRequestSchema,
  reservationDetailResponseSchema,
  type CheckoutResponse,
  type ReservationDetailResponse,
} from '@war-ticket/contracts'
import { Navbar } from '@/components/navbar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { apiJson } from '@/lib/client/api'

interface PaymentPageProps {
  readonly searchParams: Promise<{ reservationId?: string }>
}

function idr(value: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(value)
}

function remainingSeconds(expiresAt: string): number {
  return Math.max(0, Math.ceil((new Date(expiresAt).getTime() - Date.now()) / 1_000))
}

function formatDuration(seconds: number): string {
  return `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`
}

export default function PaymentPage({ searchParams }: PaymentPageProps) {
  const { reservationId } = use(searchParams)
  const router = useRouter()
  const [reservation, setReservation] = useState<ReservationDetailResponse | null>(null)
  const [seconds, setSeconds] = useState(0)
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [nik, setNik] = useState('')
  const [nikConsent, setNikConsent] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (reservationId === undefined) {
      setError('Reservation tidak ditemukan.')
      return
    }
    let cancelled = false
    void apiJson(`/api/v1/reservations/${reservationId}`)
      .then((body) => {
        const parsed = reservationDetailResponseSchema.parse(body)
        if (!cancelled) {
          setReservation(parsed)
          setSeconds(remainingSeconds(parsed.expiresAt))
        }
      })
      .catch((cause: unknown) => {
        if (!cancelled) setError(cause instanceof Error ? cause.message : 'Reservation gagal dimuat.')
      })
    return () => {
      cancelled = true
    }
  }, [reservationId])

  useEffect(() => {
    if (reservation === null) return
    const timer = setInterval(() => setSeconds(remainingSeconds(reservation.expiresAt)), 1_000)
    return () => clearInterval(timer)
  }, [reservation])

  const continuePayment = (checkout: CheckoutResponse): void => {
    if (checkout.orderStatus === 'PAID') {
      router.replace(`/order-confirmation?orderId=${checkout.orderId}`)
      return
    }
    if (checkout.redirectUrl !== null) {
      window.location.assign(checkout.redirectUrl)
      return
    }
    if (checkout.retryAfterMs === null) {
      setError('Sesi pembayaran belum tersedia. Silakan coba kembali.')
      setSubmitting(false)
      return
    }
    window.setTimeout(() => {
      void apiJson(`/api/v1/orders/${checkout.orderId}/payment`)
        .then((body) => continuePayment(checkoutResponseSchema.parse(body)))
        .catch((cause: unknown) => {
          setError(cause instanceof Error ? cause.message : 'Status pembayaran gagal diperiksa.')
          setSubmitting(false)
        })
    }, checkout.retryAfterMs)
  }

  const submit = async (event: React.FormEvent): Promise<void> => {
    event.preventDefault()
    if (reservationId === undefined || reservation === null || seconds === 0) return
    const candidate = {
      reservationId,
      buyer: {
        fullName,
        email,
        phone,
        ...(nik === '' ? {} : { nik, consentToStoreNik: nikConsent }),
      },
    }
    const validated = createCheckoutRequestSchema.safeParse(candidate)
    if (!validated.success) {
      setError(validated.error.issues[0]?.message ?? 'Data pembeli belum valid.')
      return
    }
    const storageKey = `checkout-idempotency:${reservationId}`
    const idempotencyKey = sessionStorage.getItem(storageKey) ?? crypto.randomUUID()
    sessionStorage.setItem(storageKey, idempotencyKey)
    setSubmitting(true)
    setError(null)
    try {
      const body = await apiJson('/api/v1/checkouts', {
        method: 'POST',
        headers: { 'idempotency-key': idempotencyKey },
        body: JSON.stringify(validated.data),
      })
      continuePayment(checkoutResponseSchema.parse(body))
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Checkout gagal dibuat.')
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-zinc-950">
      <Navbar />
      <main id="main-content" className="mx-auto max-w-5xl px-4 py-10">
        <h1 className="mb-8 text-3xl font-black text-white">Checkout aman</h1>
        {error !== null && (
          <div role="alert" className="mb-6 rounded-xl border border-red-500/30 bg-red-950/30 p-4 text-red-300">
            {error}
          </div>
        )}
        {reservation === null ? (
          <div className="py-20 text-center text-zinc-400">Memuat reservation…</div>
        ) : (
          <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
            <form onSubmit={(event) => void submit(event)} className="space-y-6">
              <section className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-6">
                <h2 className="mb-5 text-xl font-bold text-white">Data pembeli</h2>
                <div className="space-y-4">
                  <div>
                    <label htmlFor="fullName" className="mb-1.5 block text-sm text-zinc-300">Nama lengkap</label>
                    <Input id="fullName" autoComplete="name" value={fullName} onChange={(event) => setFullName(event.target.value)} required className="border-zinc-700 bg-zinc-950" />
                  </div>
                  <div>
                    <label htmlFor="email" className="mb-1.5 block text-sm text-zinc-300">Email</label>
                    <Input id="email" type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} required className="border-zinc-700 bg-zinc-950" />
                  </div>
                  <div>
                    <label htmlFor="phone" className="mb-1.5 block text-sm text-zinc-300">Nomor HP</label>
                    <Input id="phone" type="tel" autoComplete="tel" placeholder="+628123456789" value={phone} onChange={(event) => setPhone(event.target.value)} required className="border-zinc-700 bg-zinc-950" />
                  </div>
                  <div>
                    <label htmlFor="nik" className="mb-1.5 block text-sm text-zinc-300">NIK <span className="text-zinc-500">(opsional untuk event yang memerlukan)</span></label>
                    <Input id="nik" inputMode="numeric" maxLength={16} value={nik} onChange={(event) => setNik(event.target.value.replace(/\D/g, ''))} className="border-zinc-700 bg-zinc-950" />
                    {nik !== '' && (
                      <label className="mt-3 flex items-start gap-2 text-xs text-zinc-400">
                        <input type="checkbox" checked={nikConsent} onChange={(event) => setNikConsent(event.target.checked)} className="mt-0.5 accent-amber-400" />
                        Saya menyetujui penyimpanan terenkripsi NIK untuk verifikasi event ini.
                      </label>
                    )}
                  </div>
                </div>
              </section>
              <Button type="submit" disabled={submitting || seconds === 0} className="w-full bg-amber-400 py-6 font-bold text-zinc-950 hover:bg-amber-300">
                {submitting ? 'Membuka Midtrans…' : `Lanjutkan pembayaran · ${idr(reservation.total)}`}
              </Button>
              <p className="text-center text-xs text-zinc-500">Metode pembayaran dipilih pada halaman aman Midtrans. War Ticket tidak menyimpan data kartu atau rekening Anda.</p>
            </form>

            <aside className="h-fit space-y-5 lg:sticky lg:top-24">
              <div className={`rounded-xl p-5 text-center ${seconds < 120 ? 'bg-red-950/40 text-red-300' : 'bg-amber-950/40 text-amber-300'}`}>
                <p className="mb-2 text-xs text-zinc-400">Hold berakhir dalam</p>
                <p className="font-mono text-4xl font-black tabular-nums" aria-live="polite">{formatDuration(seconds)}</p>
              </div>
              <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-5">
                <h2 className="font-bold text-white">{reservation.eventTitle}</h2>
                <div className="my-4 space-y-3 border-y border-zinc-800 py-4">
                  {reservation.items.map((item, index) => (
                    <div key={`${item.label}-${index}`} className="flex justify-between gap-4 text-sm">
                      <span className="text-zinc-400">{item.label} × {item.quantity}</span>
                      <span className="text-zinc-200">{idr(item.unitPrice * item.quantity)}</span>
                    </div>
                  ))}
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between text-zinc-400"><span>Subtotal</span><span>{idr(reservation.subtotal)}</span></div>
                  <div className="flex justify-between text-zinc-400"><span>Service fee</span><span>{idr(reservation.serviceFee)}</span></div>
                  <div className="flex justify-between pt-2 text-lg font-black text-white"><span>Total</span><span className="text-amber-400">{idr(reservation.total)}</span></div>
                </div>
              </div>
            </aside>
          </div>
        )}
      </main>
    </div>
  )
}
