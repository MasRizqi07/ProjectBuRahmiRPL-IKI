'use client'

import { useEffect } from 'react'

interface Props {
  error: Error & { digest?: string }
  reset: () => void
}

export default function GlobalError({ error, reset }: Props) {
  useEffect(() => {
    console.error('[Global Error]', error)
  }, [error])

  return (
    <main className="min-h-screen flex flex-col items-center justify-center gap-4 px-6 py-12 text-center">
      <h1 className="text-4xl font-black">Terjadi kesalahan</h1>
      <p className="max-w-xl text-zinc-400">{error.message}</p>
      <button
        type="button"
        onClick={reset}
        className="rounded-full bg-amber-400 px-6 py-3 text-sm font-semibold text-zinc-950 transition hover:bg-amber-500"
      >
        Coba lagi
      </button>
    </main>
  )
}
