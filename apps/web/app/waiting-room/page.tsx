'use client'

import { use, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { queueJoinResponseSchema, queueStatusResponseSchema } from '@war-ticket/contracts'
import { CheckoutProgress } from '@/components/checkout/checkout-progress'
import { InlineAlert } from '@/components/feedback/inline-alert'
import { LoadingState } from '@/components/feedback/loading-state'
import { PageShell } from '@/components/layout/page-shell'
import { QueueStatusCard } from '@/components/queue/queue-status-card'
import { Button } from '@/components/ui/button'
import { ApiClientError, apiJson } from '@/lib/client/api'

interface WaitingRoomProps {
  readonly searchParams: Promise<{
    eventId?: string
    tierId?: string
    title?: string
  }>
}

interface QueueView {
  readonly entryId: string
  readonly salesSessionId: string
  readonly state: string
  readonly position: number | null
  readonly estimatedWaitSeconds: number | null
  readonly pollAfterMs: number
  readonly admissionToken?: string
}

export default function WaitingRoom({ searchParams }: WaitingRoomProps) {
  const params = use(searchParams)
  const router = useRouter()
  const [queue, setQueue] = useState<QueueView | null>(null)
  const [error, setError] = useState<string | null>(null)
  const eventId = params.eventId

  useEffect(() => {
    if (!eventId) {
      setError('Event tidak ditemukan.')
      return
    }
    let cancelled = false
    let timer: ReturnType<typeof setTimeout> | undefined

    const handleError = (cause: unknown): boolean => {
      if (cancelled) return false
      if (cause instanceof ApiClientError && cause.status === 401) {
        const callback = `/waiting-room?eventId=${eventId}${params.tierId ? `&tierId=${params.tierId}` : ''}`
        router.replace(`/login?callbackUrl=${encodeURIComponent(callback)}`)
        return false
      }
      setError(cause instanceof Error ? cause.message : 'Antrean sedang tidak tersedia.')
      return true
    }

    const parseQueue = (body: unknown, initial: boolean): QueueView => {
      const result = initial
        ? queueJoinResponseSchema.parse(body)
        : queueStatusResponseSchema.parse(body)
      return {
        entryId: result.entryId,
        salesSessionId: result.salesSessionId,
        state: result.state,
        position: result.position,
        estimatedWaitSeconds: result.estimatedWaitSeconds,
        pollAfterMs: result.pollAfterMs,
        ...('admissionToken' in result && typeof result.admissionToken === 'string'
          ? { admissionToken: result.admissionToken }
          : {}),
      }
    }

    const route = `/api/events/${eventId}`

    const poll = async (): Promise<void> => {
      try {
        const body = await apiJson(`${route}/queue-status`)
        const next = parseQueue(body, false)
        if (cancelled) return
        setQueue(next)
        setError(null)
        if (next.state === 'ADMITTED') {
          if (next.admissionToken) {
            sessionStorage.setItem(`admission:${next.salesSessionId}`, next.admissionToken)
            router.replace(`/checkout/select?eventId=${eventId}&salesSessionId=${next.salesSessionId}`)
          }
          return
        }
        if (next.state !== 'EXPIRED') timer = setTimeout(() => void poll(), next.pollAfterMs)
      } catch (cause) {
        if (handleError(cause)) timer = setTimeout(() => void poll(), 10_000)
      }
    }

    const join = async (): Promise<void> => {
      try {
        const body = await apiJson(`${route}/join-queue`, { method: 'POST' })
        const joined = parseQueue(body, true)
        if (cancelled) return
        setQueue(joined)
        timer = setTimeout(() => void poll(), joined.pollAfterMs)
      } catch (cause) {
        handleError(cause)
      }
    }

    void join()
    return () => {
      cancelled = true
      if (timer) clearTimeout(timer)
    }
  }, [eventId, params.tierId, router])

  return (
    <PageShell
      eyebrow="Live queue"
      title={params.title ?? 'Ruang antrean'}
      description="Tetap di halaman ini. Posisi diproses secara fair dan akan dialihkan otomatis saat giliran Anda tiba."
      className="max-w-3xl"
    >
      <CheckoutProgress current={1} />
      {error ? (
        <div className="space-y-4">
          <InlineAlert variant="error">{error}</InlineAlert>
          <Button variant="outline" onClick={() => window.location.reload()} className="w-full rounded-xl">
            Coba lagi
          </Button>
        </div>
      ) : queue ? (
        <>
          <QueueStatusCard queue={queue} />
          <InlineAlert className="mt-4">
            Halaman boleh dibuka kembali, tetapi jangan keluar dari akun selama antrean berlangsung.
          </InlineAlert>
        </>
      ) : (
        <LoadingState label="Mendaftarkan posisi antrean…" />
      )}
    </PageShell>
  )
}
