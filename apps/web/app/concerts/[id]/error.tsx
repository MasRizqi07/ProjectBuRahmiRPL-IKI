'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'

interface ErrorProps {
  error: Error & { digest?: string }
  reset: () => void
}

export default function ErrorPage({ error, reset }: ErrorProps) {
  useEffect(() => {
    console.error('[Error Boundary]', error)
  }, [error])

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-6 text-center px-4">
      <div className="space-y-2">
        <h2 className="font-display text-2xl font-bold tracking-tight">Terjadi Kesalahan</h2>
        <p className="text-muted-foreground max-w-md">
          {error.message || 'Gagal memuat detail konser. Coba lagi dalam beberapa saat.'}
        </p>
        {error.digest && (
          <p className="text-xs text-muted-foreground font-mono">Error ID: {error.digest}</p>
        )}
      </div>
      <Button onClick={reset} variant="outline">
        Coba Lagi
      </Button>
    </div>
  )
}
