'use client'

import { use, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { queueJoinResponseSchema, queueStatusResponseSchema, type QueueStatusResponse } from '@war-ticket/contracts'
import { CheckoutProgress } from '@/components/checkout/checkout-progress'
import { InlineAlert } from '@/components/feedback/inline-alert'
import { LoadingState } from '@/components/feedback/loading-state'
import { PageShell } from '@/components/layout/page-shell'
import { QueueStatusCard } from '@/components/queue/queue-status-card'
import { Button } from '@/components/ui/button'
import { ApiClientError, apiJson } from '@/lib/client/api'

interface WaitingRoomProps { readonly searchParams: Promise<{ salesSessionId?: string; title?: string }> }

export default function WaitingRoom({ searchParams }: WaitingRoomProps) {
  const params = use(searchParams)
  const router = useRouter()
  const [queue, setQueue] = useState<QueueStatusResponse | null>(null)
  const [error, setError] = useState<string | null>(null)
  const salesSessionId = params.salesSessionId

  useEffect(() => {
    if (!salesSessionId) { setError('Sales session tidak ditemukan.'); return }
    let cancelled = false
    let timer: ReturnType<typeof setTimeout> | undefined

    const handleError = (cause: unknown): boolean => {
      if (cancelled) return false
      if (cause instanceof ApiClientError && cause.status === 401) {
        router.replace(`/login?callbackUrl=${encodeURIComponent(`/waiting-room?salesSessionId=${salesSessionId}`)}`)
        return false
      }
      setError(cause instanceof Error ? cause.message : 'Antrean sedang tidak tersedia.')
      return true
    }

    const poll = async (): Promise<void> => {
      try {
        const next = queueStatusResponseSchema.parse(await apiJson(`/api/v1/sales-sessions/${salesSessionId}/queue`))
        if (cancelled) return
        setQueue(next)
        setError(null)
        if (next.state === 'ADMITTED' && next.admissionToken) {
          sessionStorage.setItem(`admission:${salesSessionId}`, next.admissionToken)
          router.replace(`/checkout/select?salesSessionId=${salesSessionId}`)
          return
        }
        if (next.state !== 'EXPIRED') timer = setTimeout(() => void poll(), next.pollAfterMs)
      } catch (cause) {
        if (handleError(cause)) timer = setTimeout(() => void poll(), 10_000)
      }
    }

    const join = async (): Promise<void> => {
      try {
        const joined = queueJoinResponseSchema.parse(await apiJson(`/api/v1/sales-sessions/${salesSessionId}/queue`, { method: 'POST' }))
        if (cancelled) return
        setQueue(joined)
        timer = setTimeout(() => void poll(), joined.pollAfterMs)
      } catch (cause) { handleError(cause) }
    }

    void join()
    return () => { cancelled = true; if (timer) clearTimeout(timer) }
  }, [router, salesSessionId])

  return (
    <PageShell eyebrow="Live queue" title={params.title ?? 'Ruang antrean'} description="Tetap di halaman ini. Posisi diproses secara fair dan akan dialihkan otomatis saat giliran Anda tiba." className="max-w-3xl">
      <CheckoutProgress current={1} />
      {error ? (
        <div className="space-y-4"><InlineAlert variant="error">{error}</InlineAlert><Button variant="outline" onClick={() => window.location.reload()} className="w-full rounded-xl">Coba lagi</Button></div>
      ) : queue ? (
        <><QueueStatusCard queue={queue} /><InlineAlert className="mt-4">Halaman boleh dibuka kembali, tetapi jangan keluar dari akun selama antrean berlangsung.</InlineAlert></>
      ) : <LoadingState label="Mendaftarkan posisi antrean…" />}
    </PageShell>
  )
}
