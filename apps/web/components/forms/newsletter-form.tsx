'use client'

import { useState } from 'react'
import { ArrowRight } from 'lucide-react'
import { toast } from 'sonner'
import { apiJson } from '@/lib/client/api'

export function NewsletterForm() {
  const [email, setEmail] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const submit = async (event: React.FormEvent): Promise<void> => {
    event.preventDefault()
    setSubmitting(true)
    try {
      await apiJson('/api/newsletter', { method: 'POST', body: JSON.stringify({ email, consent: true }) })
      toast.success('Konfirmasi newsletter akan dikirim ke email Anda.')
      setEmail('')
    } catch (cause) {
      toast.error(cause instanceof Error ? cause.message : 'Pendaftaran gagal.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={(event) => void submit(event)} className="flex w-full max-w-md items-center gap-2 rounded-2xl border border-white/10 bg-white/5 p-1.5 backdrop-blur-xl">
      <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="email@contoh.com" aria-label="Email newsletter" required className="min-w-0 flex-1 bg-transparent px-4 py-2.5 text-xs text-foreground focus:outline-hidden" />
      <button disabled={submitting} className="flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-xs font-bold text-primary-foreground disabled:opacity-60"><span>{submitting ? 'Mengirim…' : 'Daftar'}</span><ArrowRight className="size-3.5" /></button>
    </form>
  )
}
