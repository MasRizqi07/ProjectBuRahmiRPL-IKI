'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  ArrowRight,
  Check,
  CheckCircle2,
  Crown,
  Flame,
  Headphones,
  Lock,
  Radio,
  ShieldCheck,
  Sparkles,
  Star,
  Ticket,
  Zap,
} from 'lucide-react'
import { Button } from '@/components/ui/button'

const plans = [
  {
    id: 'silver',
    name: 'SILVER SENTINEL',
    price: 'Rp 99.000',
    period: '/bulan',
    description: 'Untuk penikmat konser yang ingin sinyal war lebih awal dan cashback loyalty point.',
    badge: 'ENTRY LEVEL',
    color: '#c8c6c5',
    features: [
      'Sinyal Notifikasi War 15 Menit Lebih Awal',
      'Cashback 5% War Loyalty Points',
      'Badge Silver di Profil Akun',
      'Akses Presale Reguler',
    ],
    cta: 'Pilih Silver',
    highlighted: false,
  },
  {
    id: 'gold',
    name: 'GOLD VANGUARD',
    price: 'Rp 249.000',
    period: '/bulan',
    description: 'Pilihan terfavorit! Bypass antrean reguler dan amankan tiket konser incaranmu.',
    badge: 'PALING POPULER 🔥',
    color: '#F0B429',
    features: [
      'Priority Queue Pass (Bypass 50% Antrean War)',
      'Akses Tiket Presale Eksklusif Artis Global',
      'Sinyal WhatsApp Bot Otomatis 1-Click Link',
      'Cashback 10% War Loyalty Points',
      'Support Prioritas Penanganan Sengketa',
    ],
    cta: 'Gabung Gold Vanguard',
    highlighted: true,
  },
  {
    id: 'platinum',
    name: 'PLATINUM OVERLORD',
    price: 'Rp 599.000',
    period: '/bulan',
    description: 'Akses tanpa kompromi. Zero-wait checkout dan dedicated ticketing concierge 24/7.',
    badge: 'ULTIMATE VIP',
    color: '#ffd481',
    features: [
      'Zero-Wait Instant Checkout (Bypass 100% Antrean)',
      'Akses Eksklusif ke Vanguard Lounge & Secret Drops',
      'Dedicated 24/7 VIP Concierge Personal',
      'Reservasi Meja VIP & Akses Jalur Khusus Gate Venue',
      'Box Official Merchandise Eksklusif Gratis',
    ],
    cta: 'Dapatkan Akses Platinum',
    highlighted: false,
  },
]

export default function EliteMembershipPage() {
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null)

  return (
    <main className="container-shell py-8 sm:py-16 space-y-16">
      {/* Hero */}
      <section className="text-center max-w-3xl mx-auto space-y-4">
        <div className="inline-flex items-center gap-2 rounded-full border border-war-gold/40 bg-war-gold/10 px-4 py-1.5 text-xs font-bold text-war-gold-bright shadow-[0_0_20px_rgba(240,180,41,0.25)]">
          <Crown className="size-4 text-war-gold" />
          <span>WAR TICKET ELITE MEMBERSHIP PROGRAM</span>
        </div>
        <h1 className="font-display text-5xl sm:text-7xl tracking-wide text-foreground">
          BYPASS ANTREAN WAR DENGAN <br />
          <span className="text-transparent bg-clip-text bg-linear-to-r from-war-gold via-war-gold-bright to-amber-100">
            AKSES VIP PRIORITAS
          </span>
        </h1>
        <p className="text-xs sm:text-base text-muted-foreground leading-relaxed">
          Jangan biarkan kuota tiket konser impianmu habis karena antrean traffic. Bergabunglah dengan klub elit dan nikmati kecepatan akses prioritas tanpa batas.
        </p>

        <div className="pt-2">
          <Button asChild size="lg" className="rounded-2xl bg-primary px-8 font-bold text-primary-foreground hover:bg-war-gold-bright shadow-[0_0_25px_rgba(240,180,41,0.3)]">
            <Link href="/elite/lounge">
              <Sparkles className="size-4 mr-2" /> Masuk ke Vanguard VIP Lounge
            </Link>
          </Button>
        </div>
      </section>

      {/* Pricing Plans Grid */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch">
        {plans.map((plan) => (
          <div
            key={plan.id}
            className={`relative rounded-3xl p-8 flex flex-col justify-between transition-all duration-300 ${
              plan.highlighted
                ? 'border-2 border-war-gold bg-linear-to-b from-[#221c0c] to-[#121211] shadow-[0_0_40px_rgba(240,180,41,0.2)] lg:-translate-y-3'
                : 'border border-white/10 bg-[#141413] hover:border-white/20'
            }`}
          >
            {/* Top Badge */}
            <div className="flex items-center justify-between">
              <span
                className="rounded-full px-3 py-1 text-[11px] font-black uppercase tracking-wider"
                style={{
                  backgroundColor: plan.highlighted ? '#F0B429' : 'rgba(255,255,255,0.1)',
                  color: plan.highlighted ? '#000000' : '#FFFFFF',
                }}
              >
                {plan.badge}
              </span>
              <Crown className="size-5" style={{ color: plan.color }} />
            </div>

            <div className="mt-6">
              <h3 className="font-display text-3xl tracking-wide text-foreground">
                {plan.name}
              </h3>
              <p className="mt-2 text-xs text-muted-foreground leading-relaxed">
                {plan.description}
              </p>

              <div className="mt-6 flex items-baseline gap-1">
                <span className="font-display text-4xl sm:text-5xl font-bold text-foreground">
                  {plan.price}
                </span>
                <span className="text-xs text-muted-foreground font-semibold">{plan.period}</span>
              </div>
            </div>

            {/* Features List */}
            <div className="my-8 space-y-3 border-t border-white/10 pt-6">
              <p className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">
                Keuntungan Keanggotaan:
              </p>
              {plan.features.map((feat) => (
                <div key={feat} className="flex items-start gap-2.5 text-xs text-foreground">
                  <CheckCircle2 className="size-4 shrink-0 text-war-gold mt-0.5" />
                  <span>{feat}</span>
                </div>
              ))}
            </div>

            {/* Button */}
            <Button
              onClick={() => setSelectedPlan(plan.id)}
              className={`w-full rounded-xl py-6 font-bold text-xs uppercase tracking-wider transition ${
                plan.highlighted
                  ? 'bg-war-gold text-black hover:bg-war-gold-bright shadow-[0_0_20px_rgba(240,180,41,0.3)]'
                  : 'border border-white/20 bg-white/5 text-foreground hover:bg-white/10 hover:border-war-gold/40'
              }`}
            >
              {plan.cta}
            </Button>
          </div>
        ))}
      </section>

      {/* Benefits Comparison Table */}
      <section className="rounded-3xl border border-white/10 bg-[#141413] p-6 sm:p-10 space-y-6">
        <h2 className="font-display text-3xl text-foreground text-center">
          Perbandingan Detail Fitur
        </h2>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-white/10 text-muted-foreground">
                <th className="pb-4 font-bold uppercase">Fitur & Layanan</th>
                <th className="pb-4 text-center font-bold uppercase">Reguler</th>
                <th className="pb-4 text-center font-bold uppercase text-war-gold">Gold Vanguard</th>
                <th className="pb-4 text-center font-bold uppercase text-amber-200">Platinum Overlord</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-foreground">
              <tr>
                <td className="py-4">Kecepatan Antrean War</td>
                <td className="py-4 text-center text-muted-foreground">Normal</td>
                <td className="py-4 text-center text-war-gold font-bold">Priority (50% Lebih Cepat)</td>
                <td className="py-4 text-center text-amber-300 font-bold">Zero-Wait (Instan)</td>
              </tr>
              <tr>
                <td className="py-4">Akses Presale Artis Internasional</td>
                <td className="py-4 text-center text-muted-foreground">Tidak</td>
                <td className="py-4 text-center text-status-success font-bold">Ya (Kuota Khusus)</td>
                <td className="py-4 text-center text-status-success font-bold">Ya (Akses Pertama)</td>
              </tr>
              <tr>
                <td className="py-4">Dedicated 24/7 Ticketing Concierge</td>
                <td className="py-4 text-center text-muted-foreground">Standar Support</td>
                <td className="py-4 text-center text-muted-foreground">WhatsApp Bot</td>
                <td className="py-4 text-center text-status-success font-bold">Personal Human Concierge</td>
              </tr>
              <tr>
                <td className="py-4">Vanguard VIP Lounge Access</td>
                <td className="py-4 text-center text-muted-foreground">Terkunci</td>
                <td className="py-4 text-center text-muted-foreground">Terkunci</td>
                <td className="py-4 text-center text-status-success font-bold">Unlimited Access</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </main>
  )
}

