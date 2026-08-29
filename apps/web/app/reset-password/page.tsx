'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { KeyRound } from 'lucide-react'
import { AuthShell } from '@/components/auth/auth-shell'
import { FormField } from '@/components/forms/form-field'
import { InlineAlert } from '@/components/feedback/inline-alert'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'

export default function ResetPasswordPage() {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [confirmation, setConfirmation] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const submit = async (event: React.FormEvent): Promise<void> => {
    event.preventDefault()
    setError(null)
    if (password.length < 10 || !/[0-9]/.test(password)) return setError('Password minimal 10 karakter dan memiliki angka.')
    if (password !== confirmation) return setError('Konfirmasi password tidak cocok.')
    setSubmitting(true)
    const result = await createClient().auth.updateUser({ password })
    if (result.error) {
      setSubmitting(false)
      return setError('Sesi reset tidak valid atau sudah kedaluwarsa. Minta tautan baru.')
    }
    router.replace('/dashboard?passwordUpdated=1')
    router.refresh()
  }

  return (
    <AuthShell eyebrow="Sesi aman" title="Buat password baru" description="Tautan pemulihan hanya dapat digunakan selama sesi ini masih aktif.">
      <form onSubmit={(event) => void submit(event)} className="space-y-5">
        {error && <InlineAlert variant="error">{error}</InlineAlert>}
        <FormField id="password" label="Password baru" type="password" autoComplete="new-password" value={password} onChange={(event) => setPassword(event.target.value)} required />
        <FormField id="confirmation" label="Ulangi password" type="password" autoComplete="new-password" value={confirmation} onChange={(event) => setConfirmation(event.target.value)} required />
        <Button type="submit" size="lg" disabled={submitting} className="h-12 w-full rounded-xl font-bold"><KeyRound />{submitting ? 'Menyimpan…' : 'Simpan password baru'}</Button>
      </form>
    </AuthShell>
  )
}
