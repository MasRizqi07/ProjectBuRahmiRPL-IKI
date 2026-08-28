'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  ArrowRight,
  Check,
  Clock,
  Copy,
  CreditCard,
  Flame,
  Gift,
  Percent,
  Sparkles,
  Tag,
  Zap,
} from 'lucide-react'
import { Button } from '@/components/ui/button'

interface PromoItem {
  id: string
  code: string
  title: string
  description: string
  discount: string
  expiryDate: string
  category: 'bank' | 'flash' | 'early'
  color: string
}

const promos: PromoItem[] = [
  {
    id: 'p1',
    code: 'BCAPRESALE',
    title: 'Diskon 20% BCA Virtual Account & Kartu Kredit',
    description: 'Berlaku untuk semua pembelian tiket konser internasional dengan minimum transaksi Rp 1.000.000.',
    discount: 'DISKON 20%',
    expiryDate: 'Berakhir dalam 3 hari',
    category: 'bank',
    color: '#5bc9ff',
  },
  {
    id: 'p2',
    code: 'WARFLASH50',
    title: 'Flash Drop Cashback Rp 500.000',
    description: 'Khusus pengguna tercepat saat perang tiket festival dimulai. Kuota terbatas 100 voucher/hari.',
    discount: 'POTONGAN 500RB',
    expiryDate: 'Flash Sale • 04:22:15 Tersisa',
    category: 'flash',
    color: '#EF4444',
  },
  {
    id: 'p3',
    code: 'EARLYBIRD26',
    title: 'Early Bird Festival Pass Voucher',
    description: 'Potongan langsung Rp 150.000 untuk tiket Festival General Admission fase presale.',
    discount: 'HEMAT 150RB',
    expiryDate: 'Berlaku s.d. 30 Juni 2026',
    category: 'early',
    color: '#F0B429',
  },
  {
    id: 'p4',
    code: 'MANDIRIWARTICKET',
    title: 'Cashback Rp 300.000 Mandiri Livin',
    description: 'Gunakan pembayaran melalui Mandiri Virtual Account pada saat checkout express.',
    discount: 'CASHBACK 300RB',
    expiryDate: 'Berlaku s.d. 15 Juli 2026',
    category: 'bank',
    color: '#10B981',
  },
]

export default function PromosPage() {
  const [copiedCode, setCopiedCode] = useState<string | null>(null)
  const [categoryFilter, setCategoryFilter] = useState<'all' | 'bank' | 'flash' | 'early'>('all')

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code)
    setCopiedCode(code)
    setTimeout(() => setCopiedCode(null), 2500)
  }

  const filtered = promos.filter((p) => (categoryFilter === 'all' ? true : p.category === categoryFilter))

  return (
    <main className="container-shell py-8 sm:py-12 space-y-10">
      {/* Header */}
      <div className="border-b border-white/10 pb-6">
        <span className="section-label">PENAWARAN SPESIAL</span>
        <h1 className="mt-2 font-display text-4xl sm:text-6xl tracking-wide text-foreground">
          PROMO & VOUCHER EKSKLUSIF
        </h1>
        <p className="mt-1 text-xs sm:text-sm text-muted-foreground max-w-2xl">
          Klaim voucher potongan harga dan nikmati diskon kemitraan perbankan resmi untuk menghemat biaya konser impianmu.
        </p>
      </div>

      {/* Featured Flash Sale Hero Banner */}
      <section className="relative overflow-hidden rounded-3xl border border-urgent-red/40 bg-linear-to-r from-[#200e0e] via-[#161514] to-[#0e0e0e] p-8 sm:p-12 shadow-[0_20px_50px_rgba(239,68,68,0.25)]">
        <div className="absolute -right-20 -top-20 size-80 rounded-full bg-urgent-red/15 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8">
          <div className="max-w-xl">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1 rounded-full bg-urgent-red px-3 py-1 text-xs font-bold text-white shadow-[0_0_15px_rgba(239,68,68,0.5)] animate-pulse">
                <Flame className="size-3.5" /> FLASH SALE TERBATAS
              </span>
              <span className="font-mono text-xs font-bold text-urgent-red">SISA 04:22:15</span>
            </div>
            <h2 className="mt-4 font-display text-3xl sm:text-5xl text-foreground">
              VOUCHER WARFLASH50 — CASHBACK RP 500.000
            </h2>
            <p className="mt-2 text-xs sm:text-sm text-muted-foreground leading-relaxed">
              Gunakan kode voucher saat checkout untuk mendapatkan potongan instan tanpa syarat minimum tier!
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3 w-full lg:w-auto">
            <div className="flex items-center justify-between gap-4 rounded-2xl border border-dashed border-war-gold/50 bg-black/60 px-5 py-3 w-full sm:w-auto">
              <span className="font-mono text-base sm:text-lg font-black tracking-widest text-war-gold">
                WARFLASH50
              </span>
              <button
                onClick={() => copyCode('WARFLASH50')}
                className="flex items-center gap-1 text-xs font-bold text-war-gold-bright hover:underline"
              >
                {copiedCode === 'WARFLASH50' ? <Check className="size-4" /> : <Copy className="size-4" />}
                {copiedCode === 'WARFLASH50' ? 'Tersalin' : 'Salin'}
              </button>
            </div>

            <Button asChild className="w-full sm:w-auto rounded-xl bg-primary py-6 font-bold text-primary-foreground hover:bg-war-gold-bright">
              <Link href="/concerts">
                Gunakan Sekarang <ArrowRight className="size-4 ml-1" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Category Tabs */}
      <div className="flex flex-wrap gap-2">
        {[
          { key: 'all', label: 'Semua Penawaran' },
          { key: 'bank', label: 'Partner Bank (BCA, Mandiri)' },
          { key: 'flash', label: 'Flash Deals 🔥' },
          { key: 'early', label: 'Early Bird Presale' },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setCategoryFilter(tab.key as any)}
            className={`rounded-full px-5 py-2.5 text-xs font-bold transition-all ${
              categoryFilter === tab.key
                ? 'bg-war-gold text-black shadow-[0_0_15px_rgba(240,180,41,0.25)]'
                : 'border border-white/10 bg-white/4 text-muted-foreground hover:border-white/20 hover:text-foreground'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Promos Cards Grid */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filtered.map((promo) => (
          <div
            key={promo.id}
            className="rounded-3xl border border-white/10 bg-[#141413] p-6 hover:border-war-gold/40 transition-all flex flex-col justify-between shadow-xl relative overflow-hidden group"
          >
            <div>
              <div className="flex items-start justify-between">
                <span
                  className="rounded-full px-3 py-1 text-xs font-black text-black"
                  style={{ backgroundColor: promo.color }}
                >
                  {promo.discount}
                </span>
                <span className="flex items-center gap-1 text-[11px] font-mono text-muted-foreground">
                  <Clock className="size-3.5" /> {promo.expiryDate}
                </span>
              </div>

              <h3 className="mt-4 font-display text-2xl tracking-wide text-foreground">
                {promo.title}
              </h3>
              <p className="mt-2 text-xs text-muted-foreground leading-relaxed">
                {promo.description}
              </p>
            </div>

            <div className="mt-6 pt-4 border-t border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-2 rounded-xl bg-black/50 border border-white/10 px-3.5 py-2">
                <Tag className="size-3.5 text-war-gold" />
                <span className="font-mono text-xs font-bold text-war-gold-bright tracking-wider">
                  {promo.code}
                </span>
              </div>

              <button
                onClick={() => copyCode(promo.code)}
                className="flex items-center gap-1.5 rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-xs font-bold text-foreground hover:border-war-gold/40 hover:bg-white/10 transition"
              >
                {copiedCode === promo.code ? (
                  <>
                    <Check className="size-3.5 text-status-success" /> Tersalin!
                  </>
                ) : (
                  <>
                    <Copy className="size-3.5" /> Salin Kode
                  </>
                )}
              </button>
            </div>
          </div>
        ))}
      </section>
    </main>
  )
}

