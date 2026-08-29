'use client'

import { useState } from 'react'
import { Bell, BellOff } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { apiJson } from '@/lib/client/api'

export function SubscribeButton({ eventId }: { readonly eventId: string }) {
  const [subscribed, setSubscribed] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const toggle = async (): Promise<void> => {
    setSubmitting(true)
    try {
      await apiJson(`/api/events/${eventId}/subscribe`, subscribed ? { method: 'DELETE' } : { method: 'POST', body: JSON.stringify({ channels: ['EMAIL'] }) })
      setSubscribed((current) => !current)
      toast.success(subscribed ? 'Subscription dihentikan.' : 'Event berhasil diikuti.')
    } catch (cause) { toast.error(cause instanceof Error ? cause.message : 'Subscription gagal.') }
    finally { setSubmitting(false) }
  }
  return <Button variant="outline" disabled={submitting} onClick={() => void toggle()}>{subscribed ? <BellOff /> : <Bell />}{subscribed ? 'Berhenti mengikuti' : 'Ikuti event'}</Button>
}
