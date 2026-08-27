'use client'

import { use, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  queueJoinResponseSchema,
  queueStatusResponseSchema,
  type QueueStatusResponse,
} from '@war-ticket/contracts'
import { Navbar } from '@/components/navbar'
import { Button } from '@/components/ui/button'
import { ApiClientError, apiJson } from '@/lib/client/api'

interface WaitingRoomProps {
  readonly searchParams: Promise<{ salesSessionId?: string; title?: string }>
}

function formatDuration(seconds: number | null): string {
  if (seconds === null) return 'Menghitung…'
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = seconds % 60
  return `${String(minutes).padStart(2, '0')}:${String(remainingSeconds).padStart(2, '0')}`
}

export default function WaitingRoom({ searchParams }: WaitingRoomProps) {
  const params = use(searchParams)
  const router = useRouter()
  const [queue, setQueue] = useState<QueueStatusResponse | null>(null)
  const [error, setError] = useState<string | null>(null)
  const salesSessionId = params.salesSessionId

  useEffect(() => {
    if (salesSessionId === undefined) {
      setError('Sales session tidak ditemukan.')
      return
    }
    let cancelled = false
    let timer: ReturnType<typeof setTimeout> | undefined

    const handleError = (cause: unknown): void => {
      if (cancelled) return
      if (cause instanceof ApiClientError && cause.status === 401) {
        router.replace(`/login?callbackUrl=${encodeURIComponent(`/waiting-room?salesSessionId=${salesSessionId}`)}`)
        return
      }
      setError(cause instanceof Error ? cause.message : 'Antrean sedang tidak tersedia.')
    }

    const poll = async (): Promise<void> => {
      try {
        const body = await apiJson(`/api/v1/sales-sessions/${salesSessionId}/queue`)
        const next = queueStatusResponseSchema.parse(body)
        if (cancelled) return
        setQueue(next)
        setError(null)
        if (next.state === 'ADMITTED' && next.admissionToken !== undefined) {
          sessionStorage.setItem(`admission:${salesSessionId}`, next.admissionToken)
          router.replace(`/checkout/select?salesSessionId=${salesSessionId}`)
          return
        }
        if (next.state !== 'EXPIRED') timer = setTimeout(() => void poll(), next.pollAfterMs)
      } catch (cause) {
        handleError(cause)
        timer = setTimeout(() => void poll(), 10_000)
      }
    }

    const join = async (): Promise<void> => {
      try {
        const body = await apiJson(`/api/v1/sales-sessions/${salesSessionId}/queue`, {
          method: 'POST',
        })
        const joined = queueJoinResponseSchema.parse(body)
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
      if (timer !== undefined) clearTimeout(timer)
    }
  }, [router, salesSessionId])

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col">
      <Navbar />
      <main id="main-content" className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md space-y-8">
          <header className="text-center border-b border-zinc-800 pb-6">
            <p className="text-sm text-zinc-500 mb-2">Antrean penjualan</p>
            <h1 className="text-2xl font-bold text-foreground">{params.title ?? 'War Ticket'}</h1>
          </header>

          {error !== null ? (
            <div role="alert" className="rounded-xl border border-red-500/30 bg-red-950/30 p-5 text-center">
              <p className="text-red-300">{error}</p>
              <Button className="mt-4" variant="outline" onClick={() => window.location.reload()}>
                Coba lagi
              </Button>
            </div>
          ) : queue === null ? (
            <div className="text-center" aria-live="polite">
              <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-zinc-700 border-t-amber-400" />
              <p className="text-zinc-300">Mendaftarkan posisi antrean…</p>
            </div>
          ) : (
            <>
              <section className="relative flex justify-center py-8" aria-live="polite">
                <div className="text-center">
                  <p className="text-sm text-zinc-500 mb-2">Posisi antrean</p>
                  <p className="text-8xl font-black font-mono tabular-nums text-foreground">
                    {queue.position === null ? '—' : queue.position.toLocaleString('id-ID')}
                  </p>
                  <p className="mt-3 text-xs font-mono text-zinc-500">ID {queue.entryId.slice(0, 8).toUpperCase()}</p>
                </div>
              </section>
              <section className="rounded-xl bg-amber-950/30 p-5 text-center">
                <p className="text-xs text-zinc-400 mb-2">Perkiraan waktu tunggu</p>
                <p className="text-4xl font-black font-mono text-amber-400">
                  {formatDuration(queue.estimatedWaitSeconds)}
                </p>
              </section>
              <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4 text-sm text-zinc-400">
                Posisi tersimpan di akun Anda. Halaman boleh dibuka kembali, tetapi jangan keluar dari akun selama antrean berlangsung.
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  )
}
