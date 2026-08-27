'use client'

import { useEffect } from 'react'
import { RotateCcw, TriangleAlert } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface RouteErrorProps {
  readonly error: Error & { digest?: string }
  readonly reset: () => void
  readonly title?: string
}

export function RouteError({ error, reset, title = 'Terjadi gangguan' }: RouteErrorProps) {
  useEffect(() => { console.error('[Route Error]', error) }, [error])
  return (
    <main id="main-content" className="container-shell grid min-h-[65vh] place-items-center py-14">
      <section className="glass-panel max-w-xl rounded-2xl p-7 text-center sm:p-10">
        <div className="mx-auto mb-5 grid size-14 place-items-center rounded-2xl bg-destructive/10 text-destructive"><TriangleAlert aria-hidden="true" /></div>
        <p className="section-label mb-4 justify-center before:hidden">Sistem respons</p>
        <h1 className="font-display text-4xl tracking-wide">{title}</h1>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">{error.message || 'Permintaan belum dapat diselesaikan. Data Anda tetap aman dan dapat dicoba kembali.'}</p>
        {error.digest && <p className="mt-3 font-mono text-xs text-muted-foreground">ID {error.digest}</p>}
        <Button onClick={reset} className="mt-7 rounded-xl font-bold"><RotateCcw /> Coba lagi</Button>
      </section>
    </main>
  )
}
