'use client'

import { useState, useEffect, use } from 'react'
import { Navbar } from '@/components/navbar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import Link from 'next/link'

interface PaymentMethod {
  id: string
  name: string
  icon: string
  details: string
}

const paymentMethods: PaymentMethod[] = [
  { id: 'bca', name: 'BCA Transfer', icon: '🏦', details: 'Transfer ke rekening BCA' },
  { id: 'mandiri', name: 'Mandiri', icon: '🏦', details: 'Transfer ke rekening Mandiri' },
  { id: 'gopay', name: 'GoPay', icon: '💳', details: 'Pembayaran via GoPay' },
  { id: 'ovo', name: 'OVO', icon: '💳', details: 'Pembayaran via OVO' },
  { id: 'dana', name: 'DANA', icon: '💳', details: 'Pembayaran via DANA' },
  { id: 'card', name: 'Kartu Kredit', icon: '💳', details: 'Visa, Mastercard, atau Amex' },
]

interface PaymentPageProps {
  searchParams: Promise<{
    concert?: string
    tier?: string
    category?: string
    price?: string
  }>
}

export default function PaymentPage({ searchParams }: PaymentPageProps) {
  const params = use(searchParams)
  const [quantity, setQuantity] = useState(1)
  const [selectedPayment, setSelectedPayment] = useState('bca')
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [nik, setNik] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [seatLockTime, setSeatLockTime] = useState(600)

  const price = params.price ? parseInt(params.price) : 0
  const totalPrice = price * quantity
  const category = params.category || 'CAT 1'

  // Countdown for seat lock
  useEffect(() => {
    const interval = setInterval(() => {
      setSeatLockTime((prev) => (prev <= 1 ? 0 : prev - 1))
    }, 1000)
    return () => clearInterval(interval)
  }, [])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const newErrors: Record<string, string> = {}

    if (!fullName) newErrors.fullName = 'Nama lengkap wajib diisi'
    if (!email) newErrors.email = 'Email wajib diisi'
    else if (!email.includes('@')) newErrors.email = 'Email tidak valid'
    if (!phone) newErrors.phone = 'No. HP wajib diisi'
    if (!nik) newErrors.nik = 'No. NIK wajib diisi'
    else if (nik.length !== 16) newErrors.nik = 'No. NIK harus 16 digit'

    setErrors(newErrors)

    if (Object.keys(newErrors).length === 0) {
      // Handle payment
      console.log('Processing payment:', {
        fullName,
        email,
        phone,
        nik,
        paymentMethod: selectedPayment,
        quantity,
        totalPrice,
      })
    }
  }

  const lockTimeColor = seatLockTime < 120 ? 'text-red-400 bg-red-950/30' : 'text-amber-400 bg-amber-950/30'

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="font-display text-3xl font-black text-foreground mb-8">Pembayaran</h1>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left Column - Order Summary */}
          <div className="lg:col-span-2 space-y-6">
            {/* Order Summary Card */}
            <div className="border border-zinc-700/50 rounded-2xl p-6 bg-zinc-900/50">
              <h2 className="font-display text-xl font-bold text-foreground mb-4">Ringkasan Pesanan</h2>

              <div className="space-y-3 pb-4 border-b border-dashed border-zinc-600 mb-4">
                <div className="flex justify-between">
                  <span className="text-zinc-400">Konser</span>
                  <span className="text-foreground font-semibold">
                    {params.concert?.replace('-2024', '') || 'Konser'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-400">Tanggal</span>
                  <span className="text-foreground font-semibold">22 Juni 2024</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-400">Lokasi</span>
                  <span className="text-foreground font-semibold">Gelora Bung Karno, Jakarta</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-400">Kategori</span>
                  <span className="text-foreground font-semibold">{category}</span>
                </div>
              </div>

              {/* Quantity Selector */}
              <div className="mb-6">
                <label className="block text-sm font-semibold text-foreground mb-2">Jumlah Tiket</label>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="px-3 py-2 border border-zinc-700 rounded-lg hover:bg-zinc-800 transition-colors"
                    aria-label="Kurangi jumlah tiket"
                  >
                    −
                  </button>
                  <input
                    type="number"
                    min="1"
                    max="4"
                    value={quantity}
                    onChange={(e) => setQuantity(Math.max(1, Math.min(4, parseInt(e.target.value) || 1)))}
                    className="w-12 text-center bg-zinc-900 border border-zinc-700 rounded-lg text-foreground"
                    aria-label="Jumlah tiket"
                  />
                  <button
                    onClick={() => setQuantity(Math.min(4, quantity + 1))}
                    className="px-3 py-2 border border-zinc-700 rounded-lg hover:bg-zinc-800 transition-colors"
                    aria-label="Tambah jumlah tiket"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Price Breakdown */}
              <div className="space-y-2 text-sm mb-4 pb-4 border-b border-zinc-700/50">
                <div className="flex justify-between text-zinc-400">
                  <span>Rp {price.toLocaleString('id-ID')} × {quantity}</span>
                  <span>Rp {(price * quantity).toLocaleString('id-ID')}</span>
                </div>
                <div className="flex justify-between text-zinc-400">
                  <span>Biaya Layanan</span>
                  <span>Rp 5.000</span>
                </div>
              </div>

              {/* Total Price */}
              <div className="flex justify-between items-center">
                <span className="text-zinc-400">Total</span>
                <span className="text-3xl font-black text-amber-400">
                  Rp {(totalPrice + 5000).toLocaleString('id-ID')}
                </span>
              </div>
            </div>

            {/* Seat Lock Timer */}
            <div className={`rounded-xl p-4 text-center ${lockTimeColor}`}>
              <p className="text-xs text-zinc-400 mb-2">Kursi Terkunci Hingga</p>
              <p className="text-3xl font-black font-mono tabular-nums">{formatTime(seatLockTime)}</p>
            </div>

            {/* Payment Methods */}
            <div>
              <h2 className="font-display text-xl font-bold text-foreground mb-4">Metode Pembayaran</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {paymentMethods.map((method) => (
                  <button
                    key={method.id}
                    onClick={() => setSelectedPayment(method.id)}
                    className={`p-4 rounded-xl border-2 transition-all text-left ${
                      selectedPayment === method.id
                        ? 'border-amber-400 bg-zinc-800'
                        : 'border-zinc-700 bg-zinc-900/50 hover:border-zinc-600'
                    }`}
                  >
                    <div className="text-2xl mb-2">{method.icon}</div>
                    <p className="font-bold text-foreground text-sm">{method.name}</p>
                    <p className="text-xs text-zinc-400">{method.details}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Buyer Data Form */}
            <div>
              <h2 className="font-display text-xl font-bold text-foreground mb-4">Data Pembeli</h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Full Name */}
                <div>
                  <label className="text-sm font-semibold text-foreground mb-1.5 block">Nama Lengkap</label>
                  <Input
                    placeholder="Nama Lengkap"
                    value={fullName}
                    onChange={(e) => {
                      setFullName(e.target.value)
                      if (errors.fullName) setErrors({ ...errors, fullName: '' })
                    }}
                    className="bg-zinc-900 border-zinc-700 focus:border-amber-400 rounded-xl text-foreground"
                  />
                  {errors.fullName && <p className="text-red-400 text-xs mt-1">{errors.fullName}</p>}
                </div>

                {/* Email */}
                <div>
                  <label className="text-sm font-semibold text-foreground mb-1.5 block">Email</label>
                  <Input
                    type="email"
                    placeholder="email@example.com"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value)
                      if (errors.email) setErrors({ ...errors, email: '' })
                    }}
                    className="bg-zinc-900 border-zinc-700 focus:border-amber-400 rounded-xl text-foreground"
                  />
                  {errors.email && <p className="text-red-400 text-xs mt-1">{errors.email}</p>}
                </div>

                {/* Phone */}
                <div>
                  <label className="text-sm font-semibold text-foreground mb-1.5 block">No. HP</label>
                  <Input
                    placeholder="+62812345678"
                    value={phone}
                    onChange={(e) => {
                      setPhone(e.target.value)
                      if (errors.phone) setErrors({ ...errors, phone: '' })
                    }}
                    className="bg-zinc-900 border-zinc-700 focus:border-amber-400 rounded-xl text-foreground"
                  />
                  {errors.phone && <p className="text-red-400 text-xs mt-1">{errors.phone}</p>}
                </div>

                {/* NIK */}
                <div>
                  <label className="text-sm font-semibold text-foreground mb-1.5 block">No. NIK</label>
                  <Input
                    placeholder="1234567890123456"
                    value={nik}
                    onChange={(e) => {
                      setNik(e.target.value)
                      if (errors.nik) setErrors({ ...errors, nik: '' })
                    }}
                    className="bg-zinc-900 border-zinc-700 focus:border-amber-400 rounded-xl text-foreground"
                  />
                  {errors.nik && <p className="text-red-400 text-xs mt-1">{errors.nik}</p>}
                </div>

                {/* Pay Button */}
                <Link href="/order-confirmation">
                  <Button className="w-full bg-amber-400 hover:bg-amber-500 text-zinc-950 font-bold py-6 rounded-xl text-base">
                    Bayar Sekarang - Rp {(totalPrice + 5000).toLocaleString('id-ID')}
                  </Button>
                </Link>
              </form>
            </div>
          </div>

          {/* Right Column - Sticky Summary */}
          <div className="h-fit sticky top-24">
            <div className="border border-zinc-700/50 rounded-2xl p-6 bg-zinc-900/50">
              <h3 className="font-display font-bold text-foreground mb-4">Ringkasan Harga</h3>
              <div className="space-y-2 text-sm mb-4">
                <div className="flex justify-between">
                  <span className="text-zinc-400">Tiket ({quantity}x)</span>
                  <span className="text-foreground">Rp {(price * quantity).toLocaleString('id-ID')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-400">Biaya Layanan</span>
                  <span className="text-foreground">Rp 5.000</span>
                </div>
                <div className="border-t border-zinc-700/50 pt-2 flex justify-between font-bold">
                  <span className="text-foreground">Total</span>
                  <span className="text-amber-400">Rp {(totalPrice + 5000).toLocaleString('id-ID')}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
