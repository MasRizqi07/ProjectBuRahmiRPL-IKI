'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { Chrome, Eye, EyeOff, LogIn } from 'lucide-react'
import { toast } from 'sonner'
import { AuthShell } from '@/components/auth/auth-shell'
import { FormField } from '@/components/forms/form-field'
import { InlineAlert } from '@/components/feedback/inline-alert'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'

function internalCallback(candidate: string | null): string {
  return candidate?.startsWith('/') && !candidate.startsWith('//') ? candidate : '/'
}

export default function LoginPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const callbackUrl = internalCallback(searchParams.get('callbackUrl'))
  const registered = searchParams.get('registered') === '1'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const handleSubmit = async (event: React.FormEvent): Promise<void> => {
    event.preventDefault()
    const nextErrors: Record<string, string> = {}
    if (!email.includes('@')) nextErrors.email = 'Masukkan alamat email yang valid.'
    if (password.length < 8) nextErrors.password = 'Password minimal delapan karakter.'
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) return

    setSubmitting(true)
    const { error } = await createClient().auth.signInWithPassword({ email, password })
    if (error) {
      toast.error('Email atau password tidak cocok.')
      setSubmitting(false)
      return
    }
    router.push(callbackUrl)
    router.refresh()
  }

  const handleGoogleLogin = async (): Promise<void> => {
    setSubmitting(true)
    const { error } = await createClient().auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(callbackUrl)}` },
    })
    if (error) {
      toast.error('Google login belum dapat dimulai.')
      setSubmitting(false)
    }
  }

  return (
    <AuthShell eyebrow="Selamat datang" title="Masuk ke War Ticket" description="Lanjutkan ke antrean dan seluruh tiket yang terhubung dengan akun Anda.">
      {registered && <InlineAlert variant="success" className="mb-5">Akun berhasil dibuat. Silakan masuk untuk melanjutkan.</InlineAlert>}
      <form onSubmit={(event) => void handleSubmit(event)} className="space-y-5">
        <FormField id="email" label="Email" type="email" autoComplete="email" placeholder="nama@email.com" value={email} onChange={(event) => setEmail(event.target.value)} error={errors.email} required />
        <div>
          <div className="relative">
            <FormField id="password" label="Password" type={showPassword ? 'text' : 'password'} autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} error={errors.password} className="pr-12" required />
            <button type="button" onClick={() => setShowPassword((visible) => !visible)} className="absolute right-3 top-[42px] text-muted-foreground transition hover:text-foreground" aria-label={showPassword ? 'Sembunyikan password' : 'Tampilkan password'}>
              {showPassword ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
            </button>
          </div>
          <div className="mt-3 text-right"><span className="text-xs text-muted-foreground">Pemulihan password segera tersedia</span></div>
        </div>
        <Button type="submit" size="lg" disabled={submitting} className="h-12 w-full rounded-xl font-bold">
          <LogIn /> {submitting ? 'Mengautentikasi…' : 'Masuk'}
        </Button>
      </form>

      <div className="my-6 flex items-center gap-3 text-xs text-muted-foreground"><span className="h-px flex-1 bg-border" />atau<span className="h-px flex-1 bg-border" /></div>
      <Button type="button" variant="outline" size="lg" disabled={submitting} onClick={() => void handleGoogleLogin()} className="h-12 w-full rounded-xl font-semibold"><Chrome /> Masuk dengan Google</Button>
      <p className="mt-7 text-center text-sm text-muted-foreground">Belum punya akun? <Link href="/register" className="font-bold text-war-gold hover:text-war-gold-bright">Daftar sekarang</Link></p>
    </AuthShell>
  )
}
