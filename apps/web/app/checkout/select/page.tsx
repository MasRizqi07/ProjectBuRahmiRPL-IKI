'use client'

import { use, useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { reservationResponseSchema, salesInventoryResponseSchema, type SalesInventoryResponse } from '@war-ticket/contracts'
import { CheckoutProgress } from '@/components/checkout/checkout-progress'
import { SeatMap } from '@/components/checkout/seat-map'
import { SelectionSummary } from '@/components/checkout/selection-summary'
import { TicketQuantityCard } from '@/components/checkout/ticket-quantity-card'
import { InlineAlert } from '@/components/feedback/inline-alert'
import { LoadingState } from '@/components/feedback/loading-state'
import { PageShell } from '@/components/layout/page-shell'
import { ApiClientError, apiJson } from '@/lib/client/api'

interface SelectionPageProps {
  readonly searchParams: Promise<{ salesSessionId?: string }>
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
    if (!salesSessionId) { setError('Sales session tidak ditemukan.'); return }
    let cancelled = false
    void apiJson(`/api/v1/sales-sessions/${salesSessionId}/inventory`)
      .then((body) => { if (!cancelled) setInventory(salesInventoryResponseSchema.parse(body)) })
      .catch((cause: unknown) => { if (!cancelled) setError(cause instanceof Error ? cause.message : 'Inventori gagal dimuat.') })
    return () => { cancelled = true }
  }, [salesSessionId])

  const selectedCount = useMemo(() => Object.values(quantities).reduce((sum, quantity) => sum + quantity, 0) + selectedSeats.size, [quantities, selectedSeats])
  const subtotal = useMemo(() => {
    if (!inventory) return 0
    return inventory.ticketTypes.reduce((sum, type) => sum + type.price * (quantities[type.id] ?? 0), 0)
      + inventory.seats.reduce((sum, seat) => sum + (selectedSeats.has(seat.id) ? seat.price : 0), 0)
  }, [inventory, quantities, selectedSeats])

  const changeQuantity = (ticketTypeId: string, delta: number, available: number): void => {
    setQuantities((current) => {
      const otherCount = selectedCount - (current[ticketTypeId] ?? 0)
      return { ...current, [ticketTypeId]: Math.max(0, Math.min(available, 4 - otherCount, (current[ticketTypeId] ?? 0) + delta)) }
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
    if (!salesSessionId || !inventory || selectedCount === 0) return
    const admissionToken = sessionStorage.getItem(`admission:${salesSessionId}`)
    if (!admissionToken) { router.replace(`/waiting-room?salesSessionId=${salesSessionId}`); return }
    const generalAdmissionItems = inventory.ticketTypes
      .filter((type) => type.mode === 'GENERAL_ADMISSION' && (quantities[type.id] ?? 0) > 0)
      .map((type) => ({ kind: 'GENERAL_ADMISSION' as const, ticketTypeId: type.id, quantity: quantities[type.id] ?? 0 }))
    const assignedSeatItems = selectedSeats.size ? [{ kind: 'ASSIGNED_SEAT' as const, eventSeatIds: [...selectedSeats] }] : []

    setSubmitting(true)
    setError(null)
    try {
      const body = await apiJson('/api/v1/reservations', { method: 'POST', body: JSON.stringify({ salesSessionId, admissionToken, items: [...generalAdmissionItems, ...assignedSeatItems] }) })
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
    <PageShell eyebrow="Giliran Anda" title={inventory?.event.title ?? 'Pilih tiket'} description="Pilih maksimal empat tiket. Ketersediaan dikonfirmasi saat reservasi.">
      <CheckoutProgress current={2} />
      {error && <InlineAlert variant="error" className="mb-6">{error}</InlineAlert>}
      {!inventory ? <LoadingState label="Mengambil inventori aktual…" /> : (
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_340px]">
          <div className="space-y-10">
            <section><h2 className="mb-4 font-display text-3xl tracking-wide">General admission</h2><div className="grid gap-4 sm:grid-cols-2">{inventory.ticketTypes.filter((type) => type.mode === 'GENERAL_ADMISSION').map((type) => <TicketQuantityCard key={type.id} name={type.name} price={type.price} available={type.available} quantity={quantities[type.id] ?? 0} selectedCount={selectedCount} onChange={(delta) => changeQuantity(type.id, delta, type.available)} />)}</div></section>
            <section><h2 className="mb-4 font-display text-3xl tracking-wide">Kursi bernomor</h2><SeatMap seats={inventory.seats} selectedSeats={selectedSeats} selectedCount={selectedCount} onToggle={toggleSeat} /></section>
          </div>
          <SelectionSummary selectedCount={selectedCount} subtotal={subtotal} submitting={submitting} onReserve={() => void reserve()} />
        </div>
      )}
    </PageShell>
  )
}
