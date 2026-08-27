'use client'

import { RouteError } from '@/components/feedback/route-error'

export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <RouteError error={error} reset={reset} title="Detail konser gagal dimuat" />
}
