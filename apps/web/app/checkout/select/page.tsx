'use client'

import { use, useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  reservationResponseSchema,
  salesInventoryResponseSchema,
  type SalesInventoryResponse,
} from '@war-ticket/contracts'
import { Navbar } from '@/components/navbar'
import { Button } from '@/components/ui/button'
import { ApiClientError, apiJson } from '@/lib/client/api'

interface SelectionPageProps {
  readonly searchParams: Promise<{ salesSessionId?: string }>
}

function idr(value: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(value)
}

export default function TicketSelectionPage({ searchParams }: SelectionPageProps) {
  const { salesSessionId } = use(searchParams)
  const router = useRouter()
  const [inventory, setInventory] = useState<SalesInventoryResponse | null>(null)
  const [quantities, setQuantities] = useState<Record<string, number>>({})
  const [selectedSeats, setSelectedSeats] = useState<ReadonlySet<string>>(new Set())
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (salesSessionId === undefined) {
      setError('Sales session tidak ditemukan.')
      return
    }
    let cancelled = false
    void apiJson(`/api/v1/sales-sessions/${salesSessionId}/inventory`)
      .then((body) => {
        if (!cancelled) setInventory(salesInventoryResponseSchema.parse(body))
      })
      .catch((cause: unknown) => {
        if (!cancelled) setError(cause instanceof Error ? cause.message : 'Inventori gagal dimuat.')
      })
    return () => {
      cancelled = true
    }
  }, [salesSessionId])

  const selectedCount = useMemo(
    () => Object.values(quantities).reduce((sum, quantity) => sum + quantity, 0) + selectedSeats.size,
    [quantities, selectedSeats],
  )

  const estimatedSubtotal = useMemo(() => {
    if (inventory === null) return 0
    const gaTotal = inventory.ticketTypes.reduce(
      (sum, ticketType) => sum + ticketType.price * (quantities[ticketType.id] ?? 0),
      0,
    )
    const seatTotal = inventory.seats.reduce(
      (sum, seat) => sum + (selectedSeats.has(seat.id) ? seat.price : 0),
      0,
    )
    return gaTotal + seatTotal
  }, [inventory, quantities, selectedSeats])

  const changeQuantity = (ticketTypeId: string, delta: number, available: number): void => {
    setQuantities((current) => {
      const otherCount = selectedCount - (current[ticketTypeId] ?? 0)
      const next = Math.max(0, Math.min(available, 4 - otherCount, (current[ticketTypeId] ?? 0) + delta))
      return { ...current, [ticketTypeId]: next }
    })
  }

  const toggleSeat = (seatId: string): void => {
    setSelectedSeats((current) => {
      const next = new Set(current)
      if (next.has(seatId)) next.delete(seatId)
      else if (selectedCount < 4) next.add(seatId)
      return next
    })
  }

  const reserve = async (): Promise<void> => {
    if (salesSessionId === undefined || inventory === null || selectedCount === 0) return
    const admissionToken = sessionStorage.getItem(`admission:${salesSessionId}`)
    if (admissionToken === null) {
      router.replace(`/waiting-room?salesSessionId=${salesSessionId}`)
      return
    }
    const generalAdmissionItems = inventory.ticketTypes
      .filter((type) => type.mode === 'GENERAL_ADMISSION' && (quantities[type.id] ?? 0) > 0)
      .map((type) => ({
        kind: 'GENERAL_ADMISSION' as const,
        ticketTypeId: type.id,
        quantity: quantities[type.id] ?? 0,
      }))
    const assignedSeatItems = selectedSeats.size === 0
      ? []
      : [{ kind: 'ASSIGNED_SEAT' as const, eventSeatIds: [...selectedSeats] }]

    setSubmitting(true)
    setError(null)
    try {
      const body = await apiJson('/api/v1/reservations', {
        method: 'POST',
        body: JSON.stringify({
          salesSessionId,
          admissionToken,
          items: [...generalAdmissionItems, ...assignedSeatItems],
        }),
      })
      const reservation = reservationResponseSchema.parse(body)
      sessionStorage.removeItem(`admission:${salesSessionId}`)
      router.push(`/payment?reservationId=${reservation.id}`)
    } catch (cause) {
      if (cause instanceof ApiClientError && cause.code === 'ADMISSION_EXPIRED') {
        sessionStorage.removeItem(`admission:${salesSessionId}`)
        router.replace(`/waiting-room?salesSessionId=${salesSessionId}`)
        return
      }
      setError(cause instanceof Error ? cause.message : 'Tiket gagal diamankan.')
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-zinc-950">
      <Navbar />
      <main id="main-content" className="mx-auto max-w-6xl px-4 py-10">
        <header className="mb-8">
          <p className="text-sm font-semibold uppercase tracking-widest text-amber-400">Giliran Anda</p>
          <h1 className="mt-2 text-3xl font-black text-white">
            {inventory?.event.title ?? 'Pilih tiket'}
          </h1>
          <p className="mt-2 text-zinc-400">Pilih maksimal empat tiket. Ketersediaan dikonfirmasi saat reservasi.</p>
        </header>

        {error !== null && (
          <div role="alert" className="mb-6 rounded-xl border border-red-500/30 bg-red-950/30 p-4 text-red-300">
            {error}
          </div>
        )}

        {inventory === null ? (
          <div className="py-20 text-center text-zinc-400">Memuat inventori aktual…</div>
        ) : (
          <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
            <div className="space-y-8">
              <section>
                <h2 className="mb-4 text-xl font-bold text-white">General admission</h2>
                <div className="grid gap-3 sm:grid-cols-2">
                  {inventory.ticketTypes.filter((type) => type.mode === 'GENERAL_ADMISSION').map((type) => {
                    const quantity = quantities[type.id] ?? 0
                    return (
                      <article key={type.id} className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-5">
                        <div className="flex justify-between gap-4">
                          <div>
                            <h3 className="font-bold text-white">{type.name}</h3>
                            <p className="mt-1 text-amber-400">{idr(type.price)}</p>
                            <p className="mt-2 text-xs text-zinc-500">{type.available.toLocaleString('id-ID')} tersedia</p>
                          </div>
                          <div className="flex items-center gap-3">
                            <Button variant="outline" size="icon" onClick={() => changeQuantity(type.id, -1, type.available)} disabled={quantity === 0}>−</Button>
                            <span className="w-5 text-center font-mono text-white">{quantity}</span>
                            <Button variant="outline" size="icon" onClick={() => changeQuantity(type.id, 1, type.available)} disabled={selectedCount >= 4 || quantity >= type.available}>+</Button>
                          </div>
                        </div>
                      </article>
                    )
                  })}
                </div>
              </section>

              <section>
                <h2 className="mb-4 text-xl font-bold text-white">Kursi bernomor</h2>
                <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-5">
                  <div className="mb-6 rounded-lg bg-zinc-800 py-3 text-center text-xs font-bold uppercase tracking-[0.3em] text-zinc-400">Panggung</div>
                  <div className="grid grid-cols-4 gap-2 sm:grid-cols-8">
                    {inventory.seats.map((seat) => (
                      <button
                        key={seat.id}
                        type="button"
                        disabled={!seat.available || (selectedCount >= 4 && !selectedSeats.has(seat.id))}
                        onClick={() => toggleSeat(seat.id)}
                        aria-pressed={selectedSeats.has(seat.id)}
                        title={`${seat.section} ${seat.row}-${seat.number} · ${idr(seat.price)}`}
                        className={`rounded-md border px-2 py-2 text-xs font-bold transition ${
                          selectedSeats.has(seat.id)
                            ? 'border-amber-300 bg-amber-400 text-zinc-950'
                            : seat.available
                              ? 'border-zinc-700 bg-zinc-800 text-zinc-200 hover:border-amber-400'
                              : 'cursor-not-allowed border-zinc-900 bg-zinc-900 text-zinc-700'
                        }`}
                      >
                        {seat.row}-{seat.number}
                      </button>
                    ))}
                  </div>
                </div>
              </section>
            </div>

            <aside className="h-fit rounded-xl border border-zinc-800 bg-zinc-900/80 p-5 lg:sticky lg:top-24">
              <h2 className="font-bold text-white">Pilihan Anda</h2>
              <div className="my-5 flex items-end justify-between border-y border-zinc-800 py-4">
                <span className="text-sm text-zinc-400">{selectedCount} tiket</span>
                <span className="text-xl font-black text-amber-400">{idr(estimatedSubtotal)}</span>
              </div>
              <p className="mb-4 text-xs text-zinc-500">Harga final dan service fee dihitung ulang oleh server.</p>
              <Button onClick={() => void reserve()} disabled={selectedCount === 0 || submitting} className="w-full bg-amber-400 text-zinc-950 hover:bg-amber-300">
                {submitting ? 'Mengamankan tiket…' : 'Amankan tiket'}
              </Button>
            </aside>
          </div>
        )}
      </main>
    </div>
  )
}
