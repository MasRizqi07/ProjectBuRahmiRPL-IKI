'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Mail } from 'lucide-react'
import { AuthShell } from '@/components/auth/auth-shell'
import { FormField } from '@/components/forms/form-field'
import { InlineAlert } from '@/components/feedback/inline-alert'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const submit = async (event: React.FormEvent): Promise<void> => {
    event.preventDefault()
    setError(null)
    if (!email.includes('@')) return setError('Masukkan alamat email yang valid.')
    setSubmitting(true)
    const redirectTo = `${window.location.origin}/auth/callback?next=/reset-password`
    const result = await createClient().auth.resetPasswordForEmail(email, { redirectTo })
    setSubmitting(false)
    if (result.error) return setError('Tautan pemulihan belum dapat dikirim. Coba lagi nanti.')
    setSent(true)
  }

  return (
    <AuthShell eyebrow="Pemulihan akun" title="Reset password" description="Kami mengirim tautan satu kali ke email akun Anda.">
      {sent ? (
        <InlineAlert variant="success">Jika email terdaftar, tautan pemulihan sudah dikirim. Periksa inbox dan spam.</InlineAlert>
      ) : (
        <form onSubmit={(event) => void submit(event)} className="space-y-5">
          {error && <InlineAlert variant="error">{error}</InlineAlert>}
          <FormField id="email" label="Email" type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
          <Button type="submit" size="lg" disabled={submitting} className="h-12 w-full rounded-xl font-bold"><Mail />{submitting ? 'Mengirim…' : 'Kirim tautan reset'}</Button>
        </form>
      )}
      <p className="mt-7 text-center text-sm"><Link href="/login" className="font-bold text-war-gold">Kembali ke login</Link></p>
    </AuthShell>
  )
}
