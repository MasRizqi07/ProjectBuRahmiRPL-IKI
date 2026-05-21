'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Navbar } from '@/components/navbar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import Link from 'next/link'
import { Eye, EyeOff } from 'lucide-react'
import { toast } from 'sonner'

export default function LoginPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [touched, setTouched] = useState<Record<string, boolean>>({})

  const handleBlur = (field: string) => {
    setTouched({ ...touched, [field]: true })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const newErrors: Record<string, string> = {}

    if (!email) newErrors.email = 'Email wajib diisi'
    else if (!email.includes('@')) newErrors.email = 'Format email tidak valid'

    if (!password) newErrors.password = 'Password wajib diisi'
    else if (password.length < 8) newErrors.password = 'Password minimal 8 karakter'

    setErrors(newErrors)

    if (Object.keys(newErrors).length > 0) {
      return
    }

    const result = await signIn('credentials', {
      redirect: false,
      email,
      password,
    })

    if (result?.error) {
      toast.error('Email atau password salah')
      return
    }

    const callbackUrl = searchParams.get('callbackUrl')
    router.push(callbackUrl ? decodeURIComponent(callbackUrl) : '/')
  }

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col">
      <Navbar />

      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md space-y-8 animate-fade-up">
          {/* Header */}
          <div className="text-center">
            <h1 className="font-display text-3xl font-black text-foreground mb-2">Masuk</h1>
            <p className="text-zinc-400">Masuk ke akun WAR TICKET Anda</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email */}
            <div>
              <label htmlFor="email" className="text-sm font-semibold text-foreground mb-2 block">
                Email <span className="text-red-500">*</span>
              </label>
              <Input
                id="email"
                type="email"
                placeholder="email@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onBlur={() => handleBlur('email')}
                className="bg-zinc-900 border-zinc-700 focus:border-amber-400 rounded-xl text-foreground"
                aria-label="Alamat email"
                aria-invalid={Boolean(errors.email)}
                aria-describedby={errors.email ? 'email-error' : undefined}
              />
              {errors.email && touched.email && (
                <p className="text-red-400 text-xs mt-1" id="email-error" role="alert">
                  {errors.email}
                </p>
              )}
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="text-sm font-semibold text-foreground mb-2 block">
                Password <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onBlur={() => handleBlur('password')}
                  className="bg-zinc-900 border-zinc-700 focus:border-amber-400 rounded-xl text-foreground pr-10"
                  aria-required="true"
                  aria-label="Password"
                  aria-invalid={Boolean(errors.password)}
                  aria-describedby={errors.password ? 'password-error' : undefined}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-400"
                  aria-label={showPassword ? 'Sembunyikan password' : 'Tampilkan password'}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {errors.password && touched.password && (
                <p className="text-red-400 text-xs mt-1" id="password-error" role="alert">
                  {errors.password}
                </p>
              )}
            </div>

            {/* Forgot Password Link */}
            <div className="text-right">
              <Link href="#" className="text-xs text-amber-400 hover:text-amber-300 transition-colors" aria-label="Lupa password?">
                Lupa Password?
              </Link>
            </div>

            {/* Submit Button */}
            <Button
              className="w-full bg-amber-400 hover:bg-amber-500 text-zinc-950 font-bold py-6 rounded-xl text-base"
              type="submit"
              aria-label="Tombol masuk"
            >
              Masuk
            </Button>
          </form>

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-zinc-700" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-zinc-950 text-zinc-400">atau</span>
            </div>
          </div>

          {/* Google OAuth Button */}
          <Button
            type="button"
            className="w-full bg-zinc-900 hover:bg-zinc-800 text-foreground border border-zinc-700 font-semibold py-6 rounded-xl"
            aria-label="Masuk dengan akun Google"
          >
            <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                fill="#EA4335"
              />
            </svg>
            Masuk dengan Google
          </Button>

          {/* Register Link */}
          <p className="text-center text-zinc-400">
            Belum punya akun?{' '}
            <Link href="/register" className="text-amber-400 hover:text-amber-300 font-semibold transition-colors" aria-label="Buka halaman pendaftaran">
              Daftar Sekarang
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
