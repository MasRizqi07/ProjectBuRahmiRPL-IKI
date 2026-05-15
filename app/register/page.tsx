'use client'

import { useState } from 'react'
import { Navbar } from '@/components/navbar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import Link from 'next/link'
import { Eye, EyeOff, Check, X } from 'lucide-react'

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    nik: '',
    phone: '',
    password: '',
    confirmPassword: '',
  })
  const [agreeTerms, setAgreeTerms] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [touched, setTouched] = useState<Record<string, boolean>>({})

  const validateNIK = (nik: string) => {
    return nik.replace(/\D/g, '').length === 16
  }

  const validatePhone = (phone: string) => {
    const cleanPhone = phone.replace(/\D/g, '')
    return phone.startsWith('+62') || phone.startsWith('08') || cleanPhone.startsWith('62')
  }

  const validatePassword = (pwd: string) => {
    return pwd.length >= 8 && /\d/.test(pwd)
  }

  const getPasswordStrength = (pwd: string) => {
    if (!pwd) return 'none'
    if (pwd.length < 8) return 'lemah'
    if (pwd.length < 12 || !/[A-Z]/.test(pwd)) return 'sedang'
    return 'kuat'
  }

  const passwordStrength = getPasswordStrength(formData.password)

  const getStrengthColor = () => {
    switch (passwordStrength) {
      case 'lemah':
        return 'text-red-400'
      case 'sedang':
        return 'text-amber-400'
      case 'kuat':
        return 'text-emerald-400'
      default:
        return 'text-zinc-400'
    }
  }

  const handleBlur = (field: string) => {
    setTouched({ ...touched, [field]: true })
    validateField(field)
  }

  const validateField = (field: string) => {
    const newErrors = { ...errors }

    switch (field) {
      case 'name':
        if (!formData.name) {
          newErrors.name = 'Nama lengkap wajib diisi'
        } else if (formData.name.length < 3) {
          newErrors.name = 'Nama minimal 3 karakter'
        } else {
          delete newErrors.name
        }
        break

      case 'email':
        if (!formData.email) {
          newErrors.email = 'Email wajib diisi'
        } else if (!formData.email.includes('@')) {
          newErrors.email = 'Format email tidak valid'
        } else {
          delete newErrors.email
        }
        break

      case 'nik':
        if (!formData.nik) {
          newErrors.nik = 'NIK wajib diisi'
        } else if (!validateNIK(formData.nik)) {
          newErrors.nik = 'NIK harus terdiri dari 16 digit'
        } else {
          delete newErrors.nik
        }
        break

      case 'phone':
        if (!formData.phone) {
          newErrors.phone = 'Nomor HP wajib diisi'
        } else if (!validatePhone(formData.phone)) {
          newErrors.phone = 'Format: +62xxxxxxxxx atau 08xxxxxxxxx'
        } else {
          delete newErrors.phone
        }
        break

      case 'password':
        if (!formData.password) {
          newErrors.password = 'Password wajib diisi'
        } else if (!validatePassword(formData.password)) {
          newErrors.password = 'Minimal 8 karakter dengan 1 angka'
        } else {
          delete newErrors.password
        }
        break

      case 'confirmPassword':
        if (!formData.confirmPassword) {
          newErrors.confirmPassword = 'Konfirmasi password wajib diisi'
        } else if (formData.confirmPassword !== formData.password) {
          newErrors.confirmPassword = 'Password tidak cocok'
        } else {
          delete newErrors.confirmPassword
        }
        break
    }

    setErrors(newErrors)
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData({ ...formData, [name]: value })

    if (touched[name]) {
      validateField(name)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    const fieldsToValidate = ['name', 'email', 'nik', 'phone', 'password', 'confirmPassword']
    fieldsToValidate.forEach(validateField)

    if (!agreeTerms) {
      setErrors((prev) => ({
        ...prev,
        terms: 'Anda harus menyetujui syarat dan ketentuan',
      }))
    }

    if (Object.keys(errors).length === 0 && agreeTerms) {
      console.log('[v0] Register successful:', formData)
    }
  }

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col">
      <Navbar />

      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md space-y-6">
          {/* Header */}
          <div className="text-center">
            <h1 className="text-3xl font-black text-foreground mb-2">Daftar Sekarang</h1>
            <p className="text-zinc-400">Bergabunglah dengan WAR TICKET</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-3">
            {/* Name */}
            <div>
              <label htmlFor="name" className="text-sm font-semibold text-foreground mb-1.5 block">
                Nama Lengkap <span className="text-red-500">*</span>
              </label>
              <Input
                id="name"
                type="text"
                name="name"
                placeholder="John Doe"
                value={formData.name}
                onChange={handleChange}
                onBlur={() => handleBlur('name')}
                className="bg-zinc-900 border-zinc-700 focus:border-amber-400 rounded-xl text-foreground"
                aria-label="Nama lengkap"
                aria-invalid={errors.name ? 'true' : undefined}
                aria-describedby={errors.name ? 'name-error' : undefined}
              />
              {errors.name && touched.name && (
                <p className="text-red-400 text-xs mt-1" id="name-error" role="alert">
                  {errors.name}
                </p>
              )}
            </div>

            {/* Email */}
            <div>
              <label htmlFor="email" className="text-sm font-semibold text-foreground mb-1.5 block">
                Email <span className="text-red-500">*</span>
              </label>
              <Input
                id="email"
                type="email"
                name="email"
                placeholder="email@example.com"
                value={formData.email}
                onChange={handleChange}
                onBlur={() => handleBlur('email')}
                className="bg-zinc-900 border-zinc-700 focus:border-amber-400 rounded-xl text-foreground"
                aria-label="Alamat email"
                aria-invalid={errors.email ? 'true' : undefined}
                aria-describedby={errors.email ? 'email-error' : undefined}
              />
              {errors.email && touched.email && (
                <p className="text-red-400 text-xs mt-1" id="email-error" role="alert">
                  {errors.email}
                </p>
              )}
            </div>

            {/* NIK */}
            <div>
              <label htmlFor="nik" className="text-sm font-semibold text-foreground mb-1.5 block">
                NIK (16 Digit) <span className="text-red-500">*</span>
              </label>
              <Input
                id="nik"
                type="text"
                name="nik"
                placeholder="1234567890123456"
                value={formData.nik}
                onChange={handleChange}
                onBlur={() => handleBlur('nik')}
                maxLength={16}
                className="bg-zinc-900 border-zinc-700 focus:border-amber-400 rounded-xl text-foreground"
                aria-label="Nomor Induk Kependudukan"
                aria-invalid={errors.nik ? 'true' : undefined}
                aria-describedby={errors.nik ? 'nik-error' : undefined}
              />
              {errors.nik && touched.nik && (
                <p className="text-red-400 text-xs mt-1" id="nik-error" role="alert">
                  {errors.nik}
                </p>
              )}
            </div>

            {/* Phone */}
            <div>
              <label htmlFor="phone" className="text-sm font-semibold text-foreground mb-1.5 block">
                Nomor HP <span className="text-red-500">*</span>
              </label>
              <Input
                id="phone"
                type="tel"
                name="phone"
                placeholder="+62812345678"
                value={formData.phone}
                onChange={handleChange}
                onBlur={() => handleBlur('phone')}
                className="bg-zinc-900 border-zinc-700 focus:border-amber-400 rounded-xl text-foreground"
                aria-label="Nomor telepon"
                aria-invalid={errors.phone ? 'true' : undefined}
                aria-describedby={errors.phone ? 'phone-error' : undefined}
              />
              {errors.phone && touched.phone && (
                <p className="text-red-400 text-xs mt-1" id="phone-error" role="alert">
                  {errors.phone}
                </p>
              )}
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="text-sm font-semibold text-foreground mb-1.5 block">
                Password <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={handleChange}
                  onBlur={() => handleBlur('password')}
                  className="bg-zinc-900 border-zinc-700 focus:border-amber-400 rounded-xl text-foreground pr-10"
                  aria-label="Password"
                  aria-invalid={errors.password ? 'true' : undefined}
                  aria-describedby={errors.password ? 'password-error' : 'password-hint'}
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

              {/* Password Strength Indicator */}
              {formData.password && (
                <div className="mt-2 flex items-center gap-2">
                  <div className="flex-1 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all ${
                        passwordStrength === 'lemah'
                          ? 'w-1/3 bg-red-500'
                          : passwordStrength === 'sedang'
                            ? 'w-2/3 bg-amber-500'
                            : 'w-full bg-emerald-500'
                      }`}
                    />
                  </div>
                  <span className={`text-xs font-semibold ${getStrengthColor()}`} id="password-hint">
                    {passwordStrength === 'lemah'
                      ? 'Lemah'
                      : passwordStrength === 'sedang'
                        ? 'Sedang'
                        : 'Kuat'}
                  </span>
                </div>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <label htmlFor="confirmPassword" className="text-sm font-semibold text-foreground mb-1.5 block">
                Konfirmasi Password <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  name="confirmPassword"
                  placeholder="••••••••"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  onBlur={() => handleBlur('confirmPassword')}
                  className="bg-zinc-900 border-zinc-700 focus:border-amber-400 rounded-xl text-foreground pr-10"
                  aria-label="Konfirmasi password"
                  aria-invalid={errors.confirmPassword ? 'true' : undefined}
                  aria-describedby={errors.confirmPassword ? 'confirmPassword-error' : undefined}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-400"
                  aria-label={showConfirmPassword ? 'Sembunyikan konfirmasi password' : 'Tampilkan konfirmasi password'}
                >
                  {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {errors.confirmPassword && touched.confirmPassword && (
                <p className="text-red-400 text-xs mt-1" id="confirmPassword-error" role="alert">
                  {errors.confirmPassword}
                </p>
              )}

              {/* Password Match Indicator */}
              {formData.confirmPassword && (
                <div className="mt-2 flex items-center gap-2">
                  {formData.password === formData.confirmPassword ? (
                    <>
                      <Check size={16} className="text-emerald-400" />
                      <span className="text-xs text-emerald-400">Password cocok</span>
                    </>
                  ) : (
                    <>
                      <X size={16} className="text-red-400" />
                      <span className="text-xs text-red-400">Password tidak cocok</span>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Terms Checkbox */}
            <div className="pt-2">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={agreeTerms}
                  onChange={(e) => {
                    setAgreeTerms(e.target.checked)
                    if (e.target.checked && errors.terms) {
                      const newErrors = { ...errors }
                      delete newErrors.terms
                      setErrors(newErrors)
                    }
                  }}
                  className="mt-1 accent-amber-400"
                  aria-label="Saya menyetujui syarat dan ketentuan"
                  aria-invalid={errors.terms ? 'true' : undefined}
                  aria-describedby={errors.terms ? 'terms-error' : undefined}
                />
                <span className="text-xs text-zinc-400">
                  Saya menyetujui{' '}
                  <a href="#" className="text-amber-400 hover:text-amber-300" aria-label="Buka syarat dan ketentuan">
                    Syarat dan Ketentuan
                  </a>{' '}
                  dan{' '}
                  <a href="#" className="text-amber-400 hover:text-amber-300" aria-label="Buka kebijakan privasi">
                    Kebijakan Privasi
                  </a>
                </span>
              </label>
              {errors.terms && (
                <p className="text-red-400 text-xs mt-1" id="terms-error" role="alert">
                  {errors.terms}
                </p>
              )}
            </div>

            {/* Submit Button */}
            <Button 
              className="w-full bg-amber-400 hover:bg-amber-500 text-zinc-950 font-bold py-6 rounded-xl text-base mt-4" 
              type="submit"
              aria-label="Tombol daftar akun"
            >
              Daftar Sekarang
            </Button>
          </form>

          {/* Login Link */}
          <p className="text-center text-zinc-400 text-sm">
            Sudah punya akun?{' '}
            <Link href="/login" className="text-amber-400 hover:text-amber-300 font-semibold transition-colors" aria-label="Buka halaman masuk">
              Masuk di sini
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
