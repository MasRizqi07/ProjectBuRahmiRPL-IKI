'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  Cpu,
  Send,
  ShieldCheck,
  Wallet,
  Zap,
} from 'lucide-react'
import { InlineAlert } from '@/components/feedback/inline-alert'
import { Button } from '@/components/ui/button'
import { DesignBackdrop } from '@/components/ui/design-backdrop'
import { apiJson } from '@/lib/client/api'

export default function PartnerOnboardingPage() {
  const [formData, setFormData] = useState({
    companyName: '',
    picName: '',
    email: '',
    phone: '',
    estimatedAttendees: '10000',
    eventGenre: 'Festival Musik Internasional',
  })
  const [submitting, setSubmitting] = useState(false)
  const [result, setResult] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const submit = async (event: React.FormEvent): Promise<void> => {
    event.preventDefault(); setSubmitting(true); setError(null); setResult(null)
    try {
      const response = await apiJson('/api/partner/applications', { method: 'POST', body: JSON.stringify(formData) }) as { id: string }
      setResult(response.id)
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Pengajuan gagal dikirim.') }
    finally { setSubmitting(false) }
  }

  return (
    <main className="container-shell py-8 sm:py-16 space-y-16 max-w-6xl">
      {/* Hero Section */}
      <section className="relative mx-auto max-w-4xl overflow-hidden rounded-3xl px-6 py-12 text-center space-y-4">
        <DesignBackdrop group="war_ticket_partner_onboarding" index={0} priority imageClassName="opacity-35" overlayClassName="bg-black/75" />
        <div className="relative z-10 space-y-4">
        <div className="inline-flex items-center gap-2 rounded-full border border-war-gold/40 bg-war-gold/10 px-4 py-1.5 text-xs font-bold text-war-gold-bright shadow-[0_0_20px_rgba(240,180,41,0.2)]">
          <Zap className="size-4 text-war-gold" />
          <span>PROMOTER & EVENT ORGANIZER PARTNER PROGRAM</span>
        </div>
        <h1 className="font-display text-5xl sm:text-7xl tracking-wide text-foreground">
          INFRASTRUKTUR TIKET RESMI <br />
          <span className="text-transparent bg-clip-text bg-linear-to-r from-war-gold via-war-gold-bright to-amber-100">
            UNTUK FESTIVAL TINGKAT TINGGI
          </span>
        </h1>
        <p className="text-xs sm:text-base text-muted-foreground leading-relaxed">
          Kelola penjualan tiket dengan antrean per sesi, stok transaksional, pembatasan akses berbasis peran, dan settlement yang dapat diaudit.
        </p>

        <div className="flex justify-center gap-4 pt-2">
          <Button asChild className="rounded-xl bg-primary px-8 py-5 font-bold text-primary-foreground hover:bg-war-gold-bright shadow-[0_0_25px_rgba(240,180,41,0.25)]">
            <Link href="#apply">Daftar Jadi Promotor</Link>
          </Button>
          <Button asChild variant="outline" className="rounded-xl border-white/20 bg-white/5 font-bold">
            <Link href="/organizer">Masuk Command Center</Link>
          </Button>
        </div>
        </div>
      </section>

      {/* 3 Core Value Props */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="rounded-3xl border border-white/10 bg-[#141413] p-8 shadow-xl space-y-4">
          <div className="flex size-12 items-center justify-center rounded-2xl bg-war-gold/10 text-war-gold border border-war-gold/30">
            <Cpu className="size-6" />
          </div>
          <h3 className="font-display text-2xl tracking-wide text-foreground">
            Konsistensi Stok Transaksional
          </h3>
          <p className="text-xs text-muted-foreground leading-relaxed">
            PostgreSQL menjadi sumber kebenaran stok, sementara Redis mengatur antrean dan admission tanpa menggandakan inventori.
          </p>
        </div>

        <div className="rounded-3xl border border-white/10 bg-[#141413] p-8 shadow-xl space-y-4">
          <div className="flex size-12 items-center justify-center rounded-2xl bg-urgent-red/10 text-urgent-red border border-urgent-red/30">
            <ShieldCheck className="size-6" />
          </div>
          <h3 className="font-display text-2xl tracking-wide text-foreground">
            Kontrol Operasi Sensitif
          </h3>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Rate limit, idempotency key, RBAC tenant, dan audit trail melindungi mutasi event, checkout, scanner, dan settlement.
          </p>
        </div>

        <div className="rounded-3xl border border-white/10 bg-[#141413] p-8 shadow-xl space-y-4">
          <div className="flex size-12 items-center justify-center rounded-2xl bg-status-success/10 text-status-success border border-status-success/30">
            <Wallet className="size-6" />
          </div>
          <h3 className="font-display text-2xl tracking-wide text-foreground">
            Settlement Terverifikasi
          </h3>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Pantau laporan penjualan dan ajukan payout hanya setelah akun merchant penyelenggara dikonfigurasi serta diverifikasi.
          </p>
        </div>
      </section>

      {/* Multi-step Application Form */}
      <section id="apply" className="rounded-3xl border border-white/10 bg-[#141413] p-8 sm:p-12 space-y-8">
        <div className="border-b border-white/10 pb-6">
          <span className="text-xs font-bold uppercase tracking-widest text-war-gold">
            FORMULIR KEMITRAAN PROMOTOR
          </span>
          <h2 className="mt-2 font-display text-3xl sm:text-4xl text-foreground">
            Mulai Gelar Penjualan Tiket Konser Anda
          </h2>
          <p className="text-xs text-muted-foreground mt-1">
            Isi informasi event dan perusahaan promotor Anda. Tim kami akan melakukan verifikasi dalam kurun waktu 1x24 jam.
          </p>
        </div>

        {result && <InlineAlert variant="success">Pengajuan tersimpan dengan ID {result}. Tim verifikasi akan meninjaunya.</InlineAlert>}
        {error && <InlineAlert variant="error">{error}</InlineAlert>}

          <form onSubmit={(event) => void submit(event)} className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Nama Perusahaan / Promotor</label>
                <input
                  type="text"
                  required
                  placeholder="Cth. Ismaya Live, Soundrenaline Entertainment"
                  value={formData.companyName}
                  onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                  className="mt-2 w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-xs text-foreground focus:outline-hidden focus:border-war-gold"
                />
              </div>

              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Nama PIC / Penanggung Jawab</label>
                <input
                  type="text"
                  required
                  placeholder="Nama lengkap PIC"
                  value={formData.picName}
                  onChange={(e) => setFormData({ ...formData, picName: e.target.value })}
                  className="mt-2 w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-xs text-foreground focus:outline-hidden focus:border-war-gold"
                />
              </div>

              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Email Bisnis</label>
                <input
                  type="email"
                  required
                  placeholder="promoter@perusahaan.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="mt-2 w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-xs text-foreground focus:outline-hidden focus:border-war-gold"
                />
              </div>

              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">No. Telepon / WhatsApp</label>
                <input
                  type="tel"
                  required
                  placeholder="+62 811-xxxx-xxxx"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="mt-2 w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-xs text-foreground focus:outline-hidden focus:border-war-gold"
                />
              </div>

              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Estimasi Penonton (Kapasitas Venue)</label>
                <select
                  value={formData.estimatedAttendees}
                  onChange={(e) => setFormData({ ...formData, estimatedAttendees: e.target.value })}
                  className="mt-2 w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-xs text-foreground focus:outline-hidden focus:border-war-gold"
                >
                  <option value="5000">1.000 - 5.000 Penonton (Theater / Hall)</option>
                  <option value="15000">5.000 - 15.000 Penonton (Arena)</option>
                  <option value="50000">15.000 - 50.000 Penonton (Stadium / Festival)</option>
                  <option value="100000">50.000+ Penonton (Mega World Tour)</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Jenis / Kategori Acara</label>
                <input
                  type="text"
                  placeholder="Cth. Konser K-Pop, Festival EDM, Standup Tour"
                  value={formData.eventGenre}
                  onChange={(e) => setFormData({ ...formData, eventGenre: e.target.value })}
                  className="mt-2 w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-xs text-foreground focus:outline-hidden focus:border-war-gold"
                />
              </div>
            </div>

            <div className="flex justify-end pt-4">
              <Button disabled={submitting} type="submit" size="lg" className="rounded-xl bg-primary px-8 font-bold text-primary-foreground hover:bg-war-gold-bright shadow-[0_0_20px_rgba(240,180,41,0.2)]">
                <Send className="size-4 mr-2" /> {submitting ? 'Mengirim…' : 'Kirim Pengajuan'}
              </Button>
            </div>
          </form>
      </section>
    </main>
  )
}
