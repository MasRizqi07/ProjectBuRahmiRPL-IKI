'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Navbar } from '@/components/navbar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { createClient } from '@/lib/supabase/client'

export default function RegisterPage() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [agreeTerms, setAgreeTerms] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const submit = async (event: React.FormEvent): Promise<void> => {
    event.preventDefault()
    setError(null)
    if (name.trim().length < 2) return setError('Nama lengkap minimal dua karakter.')
    if (!/^\+?[1-9]\d{7,14}$/.test(phone)) return setError('Gunakan format nomor HP internasional, contoh +628123456789.')
    if (password.length < 10 || !/\d/.test(password)) return setError('Password minimal 10 karakter dan memiliki angka.')
    if (password !== confirmPassword) return setError('Konfirmasi password tidak cocok.')
    if (!agreeTerms) return setError('Syarat layanan dan kebijakan privasi harus disetujui.')

    setSubmitting(true)
    const supabase = createClient()
    const { error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: name.trim(), phone },
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    })
    if (signUpError !== null) {
      setError(signUpError.message)
      setSubmitting(false)
      return
    }
    router.push('/login?registered=1')
  }

  return (
    <div className="min-h-screen bg-zinc-950">
      <Navbar />
      <main id="main-content" className="mx-auto flex max-w-md flex-col px-4 pt-28 pb-12 sm:pt-32">
        <header className="mb-8 text-center">
          <h1 className="text-3xl font-black text-white">Buat akun</h1>
          <p className="mt-2 text-zinc-400">Satu akun untuk antrean dan seluruh tiket Anda.</p>
        </header>
        {error !== null && <div role="alert" className="mb-5 rounded-xl bg-red-950/40 p-4 text-sm text-red-300">{error}</div>}
        <form onSubmit={(event) => void submit(event)} className="space-y-4">
          <div>
            <label htmlFor="name" className="mb-1.5 block text-sm text-zinc-300">Nama lengkap</label>
            <Input id="name" autoComplete="name" value={name} onChange={(event) => setName(event.target.value)} required className="border-zinc-700 bg-zinc-900" />
          </div>
          <div>
            <label htmlFor="email" className="mb-1.5 block text-sm text-zinc-300">Email</label>
            <Input id="email" type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} required className="border-zinc-700 bg-zinc-900" />
          </div>
          <div>
            <label htmlFor="phone" className="mb-1.5 block text-sm text-zinc-300">Nomor HP</label>
            <Input id="phone" type="tel" autoComplete="tel" placeholder="+628123456789" value={phone} onChange={(event) => setPhone(event.target.value)} required className="border-zinc-700 bg-zinc-900" />
          </div>
          <div>
            <label htmlFor="password" className="mb-1.5 block text-sm text-zinc-300">Password</label>
            <Input id="password" type="password" autoComplete="new-password" value={password} onChange={(event) => setPassword(event.target.value)} required className="border-zinc-700 bg-zinc-900" />
          </div>
          <div>
            <label htmlFor="confirmPassword" className="mb-1.5 block text-sm text-zinc-300">Konfirmasi password</label>
            <Input id="confirmPassword" type="password" autoComplete="new-password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} required className="border-zinc-700 bg-zinc-900" />
          </div>
          <label className="flex items-start gap-3 text-xs text-zinc-400">
            <input type="checkbox" checked={agreeTerms} onChange={(event) => setAgreeTerms(event.target.checked)} className="mt-0.5 accent-amber-400" />
            Saya menyetujui syarat layanan dan kebijakan privasi War Ticket.
          </label>
          <Button type="submit" disabled={submitting} className="w-full bg-amber-400 py-6 font-bold text-zinc-950 hover:bg-amber-300">
            {submitting ? 'Membuat akun…' : 'Daftar'}
          </Button>
        </form>
        <p className="mt-6 text-center text-sm text-zinc-400">
          Sudah punya akun? <Link href="/login" className="font-semibold text-amber-400">Masuk</Link>
        </p>
      </main>
    </div>
  )
}
