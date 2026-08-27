'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { UserPlus } from 'lucide-react'
import { AuthShell } from '@/components/auth/auth-shell'
import { InlineAlert } from '@/components/feedback/inline-alert'
import { FormField } from '@/components/forms/form-field'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'

export default function RegisterPage() {
  const router = useRouter()
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '', confirmPassword: '' })
  const [agreeTerms, setAgreeTerms] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const update = (field: keyof typeof form) => (event: React.ChangeEvent<HTMLInputElement>) => setForm((current) => ({ ...current, [field]: event.target.value }))

  const submit = async (event: React.FormEvent): Promise<void> => {
    event.preventDefault()
    setError(null)
    if (form.name.trim().length < 2) return setError('Nama lengkap minimal dua karakter.')
    if (!/^\+?[1-9]\d{7,14}$/.test(form.phone)) return setError('Gunakan format nomor HP internasional, contoh +628123456789.')
    if (form.password.length < 10 || !/\d/.test(form.password)) return setError('Password minimal 10 karakter dan memiliki angka.')
    if (form.password !== form.confirmPassword) return setError('Konfirmasi password tidak cocok.')
    if (!agreeTerms) return setError('Syarat layanan dan kebijakan privasi harus disetujui.')

    setSubmitting(true)
    const { error: signUpError } = await createClient().auth.signUp({
      email: form.email,
      password: form.password,
      options: { data: { full_name: form.name.trim(), phone: form.phone }, emailRedirectTo: `${window.location.origin}/auth/callback` },
    })
    if (signUpError) {
      setError(signUpError.message)
      setSubmitting(false)
      return
    }
    router.push('/login?registered=1')
  }

  return (
    <AuthShell eyebrow="Akun baru" title="Siap masuk arena?" description="Buat satu akun untuk antrean, checkout, dan riwayat tiket Anda.">
      {error && <InlineAlert variant="error" className="mb-5">{error}</InlineAlert>}
      <form onSubmit={(event) => void submit(event)} className="space-y-4">
        <FormField id="name" label="Nama lengkap" autoComplete="name" value={form.name} onChange={update('name')} required />
        <FormField id="email" label="Email" type="email" autoComplete="email" value={form.email} onChange={update('email')} required />
        <FormField id="phone" label="Nomor HP" type="tel" autoComplete="tel" placeholder="+628123456789" value={form.phone} onChange={update('phone')} required />
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField id="password" label="Password" type="password" autoComplete="new-password" value={form.password} onChange={update('password')} required />
          <FormField id="confirmPassword" label="Konfirmasi" type="password" autoComplete="new-password" value={form.confirmPassword} onChange={update('confirmPassword')} required />
        </div>
        <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-white/8 bg-black/20 p-4 text-xs leading-5 text-muted-foreground">
          <input type="checkbox" checked={agreeTerms} onChange={(event) => setAgreeTerms(event.target.checked)} className="mt-0.5 size-4 accent-primary" />
          Saya menyetujui syarat layanan dan kebijakan privasi War Ticket.
        </label>
        <Button type="submit" size="lg" disabled={submitting} className="h-12 w-full rounded-xl font-bold"><UserPlus /> {submitting ? 'Membuat akun…' : 'Daftar'}</Button>
      </form>
      <p className="mt-7 text-center text-sm text-muted-foreground">Sudah punya akun? <Link href="/login" className="font-bold text-war-gold">Masuk</Link></p>
    </AuthShell>
  )
}
