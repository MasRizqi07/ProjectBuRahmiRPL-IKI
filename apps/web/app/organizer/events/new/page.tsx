'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Plus,
  Sparkles,
  Trash2,
} from 'lucide-react'
import { CapabilityNotice } from '@/components/feedback/capability-notice'
import { Button } from '@/components/ui/button'

interface TicketTierConfig {
  name: string
  price: number
  capacity: number
  perks: string
}

export default function NewEventSetupPage() {
  const [step, setStep] = useState(1)

  const [eventData, setEventData] = useState({
    title: '',
    artist: '',
    category: 'rock',
    date: '2026-07-15',
    time: '19:00',
    venue: '',
    city: 'Jakarta',
    description: '',
    maxTicketsPerUser: 4,
    requireNik: true,
    warStartDateTime: '2026-06-01T10:00',
  })

  const [tiers, setTiers] = useState<TicketTierConfig[]>([
    { name: 'VIP STANDING', price: 3500000, capacity: 500, perks: 'Akses VIP lounge + Official Merch' },
    { name: 'CAT 1 CENTER', price: 1850000, capacity: 1200, perks: 'Kursi tribun tengah panggung' },
    { name: 'FESTIVAL', price: 750000, capacity: 3000, perks: 'General admission area berdiri' },
  ])

  const updateTier = (index: number, field: keyof TicketTierConfig, value: string | number) => {
    setTiers((prev) => prev.map((item, i) => (i === index ? { ...item, [field]: value } : item)))
  }

  const addTier = () => {
    setTiers([...tiers, { name: 'NEW TIER', price: 1000000, capacity: 1000, perks: '' }])
  }

  const removeTier = (index: number) => {
    setTiers(tiers.filter((_, i) => i !== index))
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-16">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/10 pb-6">
        <div>
          <Link
            href="/organizer"
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-war-gold transition mb-2"
          >
            <ArrowLeft className="size-3.5" /> Kembali ke Command Center
          </Link>
          <h1 className="font-display text-4xl text-foreground">
            SETUP EVENT & INVENTORI TIKET
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Konfigurasikan detail konser, alokasi tier tiket, dan parameter antrean perang tiket.
          </p>
        </div>

        {/* Step Indicator */}
        <div className="flex items-center gap-2">
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              className={`flex size-8 items-center justify-center rounded-xl font-mono text-xs font-bold transition ${
                step === s
                  ? 'bg-war-gold text-black shadow-[0_0_15px_rgba(240,180,41,0.3)]'
                  : step > s
                  ? 'bg-status-success text-black'
                  : 'bg-white/5 border border-white/10 text-muted-foreground'
              }`}
            >
              {step > s ? <Check className="size-4" /> : s}
            </div>
          ))}
        </div>
      </div>

      {/* Step 1: Info Dasar & Venue */}
      {step === 1 && (
        <section className="rounded-3xl border border-white/10 bg-[#141413] p-8 space-y-6">
          <h2 className="font-display text-2xl text-foreground">1. Informasi Konser & Lokasi</h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Judul Konser / Event</label>
              <input
                type="text"
                placeholder="Cth. Coldplay Music of the Spheres Tour Jakarta"
                value={eventData.title}
                onChange={(e) => setEventData({ ...eventData, title: e.target.value })}
                className="mt-2 w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-xs text-foreground focus:outline-hidden focus:border-war-gold"
              />
            </div>

            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Nama Artis / Lineup</label>
              <input
                type="text"
                placeholder="Cth. Coldplay"
                value={eventData.artist}
                onChange={(e) => setEventData({ ...eventData, artist: e.target.value })}
                className="mt-2 w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-xs text-foreground focus:outline-hidden focus:border-war-gold"
              />
            </div>

            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Genre / Kategori</label>
              <select
                value={eventData.category}
                onChange={(e) => setEventData({ ...eventData, category: e.target.value })}
                className="mt-2 w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-xs text-foreground focus:outline-hidden focus:border-war-gold"
              >
                <option value="rock">Rock / Alternative</option>
                <option value="pop">Pop / K-Pop</option>
                <option value="electronic">EDM / Electronic Festival</option>
                <option value="indie">Indie / Acoustic</option>
                <option value="hiphop">Hip-Hop / R&B</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Nama Venue / Stadion</label>
              <input
                type="text"
                placeholder="Cth. Stadion Utama Gelora Bung Karno"
                value={eventData.venue}
                onChange={(e) => setEventData({ ...eventData, venue: e.target.value })}
                className="mt-2 w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-xs text-foreground focus:outline-hidden focus:border-war-gold"
              />
            </div>

            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Kota Pelaksanaan</label>
              <input
                type="text"
                placeholder="Cth. Jakarta"
                value={eventData.city}
                onChange={(e) => setEventData({ ...eventData, city: e.target.value })}
                className="mt-2 w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-xs text-foreground focus:outline-hidden focus:border-war-gold"
              />
            </div>

            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Tanggal Konser</label>
              <input
                type="date"
                value={eventData.date}
                onChange={(e) => setEventData({ ...eventData, date: e.target.value })}
                className="mt-2 w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-xs text-foreground focus:outline-hidden focus:border-war-gold"
              />
            </div>

            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Waktu Open Gate</label>
              <input
                type="time"
                value={eventData.time}
                onChange={(e) => setEventData({ ...eventData, time: e.target.value })}
                className="mt-2 w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-xs text-foreground focus:outline-hidden focus:border-war-gold"
              />
            </div>
          </div>

          <div className="flex justify-end pt-4">
            <Button
              type="button"
              onClick={() => setStep(2)}
              className="rounded-xl bg-primary px-8 font-bold text-primary-foreground hover:bg-war-gold-bright"
            >
              Lanjut ke Tier Tiket <ArrowRight className="size-4 ml-2" />
            </Button>
          </div>
        </section>
      )}

      {/* Step 2: Konfigurasi Tier Tiket & Kuota */}
      {step === 2 && (
        <section className="rounded-3xl border border-white/10 bg-[#141413] p-8 space-y-6">
          <div className="flex items-center justify-between border-b border-white/8 pb-4">
            <h2 className="font-display text-2xl text-foreground">2. Matriks Tier Tiket & Kuota</h2>
            <Button
              type="button"
              onClick={addTier}
              variant="outline"
              size="sm"
              className="rounded-xl border-war-gold/40 text-war-gold hover:bg-war-gold hover:text-black text-xs font-bold"
            >
              <Plus className="size-3.5 mr-1" /> Tambah Tier Baru
            </Button>
          </div>

          <div className="space-y-4">
            {tiers.map((tier, index) => (
              <div
                key={index}
                className="rounded-2xl border border-white/8 bg-black/40 p-5 grid grid-cols-1 sm:grid-cols-4 gap-4 items-end relative"
              >
                <div>
                  <label className="text-[10px] font-bold uppercase text-muted-foreground">Nama Kategori Tier</label>
                  <input
                    type="text"
                    value={tier.name}
                    onChange={(e) => updateTier(index, 'name', e.target.value)}
                    className="mt-1 w-full rounded-xl border border-white/10 bg-[#141413] px-3 py-2 text-xs text-foreground"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold uppercase text-muted-foreground">Harga Tiket (Rp)</label>
                  <input
                    type="number"
                    value={tier.price}
                    onChange={(e) => updateTier(index, 'price', Number(e.target.value))}
                    className="mt-1 w-full rounded-xl border border-white/10 bg-[#141413] px-3 py-2 text-xs text-war-gold font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold uppercase text-muted-foreground">Kapasitas Kuota Tiket</label>
                  <input
                    type="number"
                    value={tier.capacity}
                    onChange={(e) => updateTier(index, 'capacity', Number(e.target.value))}
                    className="mt-1 w-full rounded-xl border border-white/10 bg-[#141413] px-3 py-2 text-xs text-foreground font-mono"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <div className="flex-1">
                    <label className="text-[10px] font-bold uppercase text-muted-foreground">Fasilitas / Perks</label>
                    <input
                      type="text"
                      value={tier.perks}
                      placeholder="Cth. VIP Free Drink"
                      onChange={(e) => updateTier(index, 'perks', e.target.value)}
                      className="mt-1 w-full rounded-xl border border-white/10 bg-[#141413] px-3 py-2 text-xs text-muted-foreground"
                    />
                  </div>
                  {tiers.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeTier(index)}
                      className="mb-1 p-2 text-muted-foreground hover:text-urgent-red transition"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-between pt-4 border-t border-white/8">
            <Button
              type="button"
              variant="outline"
              onClick={() => setStep(1)}
              className="rounded-xl border-white/10"
            >
              <ArrowLeft className="size-4 mr-2" /> Kembali
            </Button>
            <Button
              type="button"
              onClick={() => setStep(3)}
              className="rounded-xl bg-primary px-8 font-bold text-primary-foreground hover:bg-war-gold-bright"
            >
              Lanjut ke Aturan Anti-Bot <ArrowRight className="size-4 ml-2" />
            </Button>
          </div>
        </section>
      )}

      {/* Step 3: Aturan War & Publish */}
      {step === 3 && (
        <section className="rounded-3xl border border-white/10 bg-[#141413] p-8 space-y-6">
          <h2 className="font-display text-2xl text-foreground">3. Aturan Queue War & Proteksi Anti-Bot</h2>

          <CapabilityNotice capability="organizerEventPublishing" />

          <div className="space-y-4">
            <div className="rounded-2xl border border-white/8 bg-black/40 p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-foreground">Wajib Verifikasi NIK Pemegang Tiket</p>
                  <p className="text-[11px] text-muted-foreground">Mencegah calo membeli tiket massal dengan bot.</p>
                </div>
                <input
                  type="checkbox"
                  checked={eventData.requireNik}
                  onChange={(e) => setEventData({ ...eventData, requireNik: e.target.checked })}
                  className="size-5 accent-war-gold"
                />
              </div>

              <div className="flex items-center justify-between border-t border-white/8 pt-4">
                <div>
                  <p className="text-xs font-bold text-foreground">Batas Maksimal Tiket Per Transaksi</p>
                  <p className="text-[11px] text-muted-foreground">Standar industri konser: 4 tiket per user NIK.</p>
                </div>
                <select
                  value={eventData.maxTicketsPerUser}
                  onChange={(e) => setEventData({ ...eventData, maxTicketsPerUser: Number(e.target.value) })}
                  className="rounded-xl border border-white/10 bg-[#141413] px-3 py-2 text-xs text-foreground"
                >
                  <option value={1}>Maks 1 Tiket</option>
                  <option value={2}>Maks 2 Tiket</option>
                  <option value={4}>Maks 4 Tiket (Standar)</option>
                  <option value={6}>Maks 6 Tiket</option>
                </select>
              </div>
            </div>
          </div>

          <div className="flex justify-between pt-4 border-t border-white/8">
            <Button
              type="button"
              variant="outline"
              onClick={() => setStep(2)}
              className="rounded-xl border-white/10"
            >
              <ArrowLeft className="size-4 mr-2" /> Kembali
            </Button>
            <Button
              type="button"
              disabled
              title="Publikasi event belum tersedia"
              className="rounded-xl bg-primary px-8 py-6 font-bold text-primary-foreground hover:bg-war-gold-bright shadow-[0_0_25px_rgba(240,180,41,0.3)]"
            >
              <Sparkles className="size-4 mr-2" /> Publikasi Belum Tersedia
            </Button>
          </div>
        </section>
      )}
    </div>
  )
}
