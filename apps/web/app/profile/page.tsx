'use client'

import { useState } from 'react'
import {
  Bell,
  CreditCard,
  Save,
  ShieldCheck,
  User,
} from 'lucide-react'
import { CapabilityNotice } from '@/components/feedback/capability-notice'
import { Button } from '@/components/ui/button'

export default function ProfileSettingsPage() {
  const [twoFactor, setTwoFactor] = useState(true)
  const [waNotifications, setWaNotifications] = useState(true)

  return (
    <main className="container-shell py-8 sm:py-12 max-w-4xl space-y-8">
      {/* Header */}
      <div className="border-b border-white/10 pb-6">
        <span className="section-label">AKUN & IDENTITAS</span>
        <h1 className="mt-2 font-display text-4xl sm:text-5xl tracking-wide text-foreground">
          PENGATURAN PROFIL & KEAMANAN
        </h1>
        <p className="mt-1 text-xs sm:text-sm text-muted-foreground">
          Data identitas NIK yang terverifikasi akan digunakan otomatis untuk mempercepat proses war tiket tanpa perlu input ulang.
        </p>
      </div>

      <CapabilityNotice capability="profilePersistence" />

      <form onSubmit={(event) => event.preventDefault()} className="space-y-8">
        {/* Section 1: Personal Info */}
        <section className="rounded-3xl border border-white/10 bg-[#141413] p-6 sm:p-8 space-y-6">
          <div className="flex items-center gap-3 border-b border-white/8 pb-4">
            <div className="flex size-9 items-center justify-center rounded-xl bg-war-gold/10 text-war-gold">
              <User className="size-5" />
            </div>
            <div>
              <h2 className="font-display text-2xl text-foreground">Identitas Pemegang Tiket</h2>
              <p className="text-xs text-muted-foreground">Sesuai KTP / Paspor untuk validasi gate konser.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Nama Lengkap Sesuai KTP</label>
              <input
                type="text"
                defaultValue="Rizqi Pratama"
                className="mt-2 w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-xs text-foreground focus:outline-hidden focus:border-war-gold"
              />
            </div>

            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                NIK / No. Paspor (Terverifikasi)
              </label>
              <div className="relative mt-2">
                <input
                  type="text"
                  defaultValue="3171012304950004"
                  className="w-full rounded-xl border border-status-success/40 bg-black/40 px-4 py-3 text-xs text-foreground focus:outline-hidden"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 text-[10px] font-bold text-status-success">
                  <ShieldCheck className="size-3.5" /> VERIFIED
                </span>
              </div>
            </div>

            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Email</label>
              <input
                type="email"
                defaultValue="rizqi.pratama@example.com"
                className="mt-2 w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-xs text-foreground focus:outline-hidden focus:border-war-gold"
              />
            </div>

            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">No. WhatsApp (Notifikasi War)</label>
              <input
                type="tel"
                defaultValue="+62 812-3456-7890"
                className="mt-2 w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-xs text-foreground focus:outline-hidden focus:border-war-gold"
              />
            </div>
          </div>
        </section>

        {/* Section 2: Quick Payment Cards */}
        <section className="rounded-3xl border border-white/10 bg-[#141413] p-6 sm:p-8 space-y-6">
          <div className="flex items-center gap-3 border-b border-white/8 pb-4">
            <div className="flex size-9 items-center justify-center rounded-xl bg-blue-500/10 text-blue-400">
              <CreditCard className="size-5" />
            </div>
            <div>
              <h2 className="font-display text-2xl text-foreground">Metode Pembayaran Express</h2>
              <p className="text-xs text-muted-foreground">1-Click Fast Checkout saat memenangkan antrean war.</p>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between rounded-2xl border border-war-gold/40 bg-war-gold/5 p-4">
              <div className="flex items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-xl bg-black border border-white/10 text-war-gold font-bold text-xs">
                  BCA
                </div>
                <div>
                  <p className="text-xs font-bold text-foreground">BCA Virtual Account (Auto-Connect)</p>
                  <p className="text-[11px] text-muted-foreground">Utama • Express Payment</p>
                </div>
              </div>
              <span className="rounded-full bg-war-gold px-2.5 py-0.5 text-[10px] font-black text-black">
                DEFAULT
              </span>
            </div>

            <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-black/20 p-4">
              <div className="flex items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-xl bg-black border border-white/10 text-emerald-400 font-bold text-xs">
                  QRIS
                </div>
                <div>
                  <p className="text-xs font-bold text-foreground">QRIS Instant Dynamic</p>
                  <p className="text-[11px] text-muted-foreground">GoPay, OVO, ShopeePay, Dana</p>
                </div>
              </div>
              <Button disabled type="button" title="Penyimpanan profil belum tersedia" variant="ghost" size="sm" className="text-xs text-muted-foreground hover:text-foreground">
                Belum tersedia
              </Button>
            </div>
          </div>
        </section>

        {/* Section 3: Notification & Security */}
        <section className="rounded-3xl border border-white/10 bg-[#141413] p-6 sm:p-8 space-y-6">
          <div className="flex items-center gap-3 border-b border-white/8 pb-4">
            <div className="flex size-9 items-center justify-center rounded-xl bg-purple-500/10 text-purple-400">
              <Bell className="size-5" />
            </div>
            <div>
              <h2 className="font-display text-2xl text-foreground">Preferensi Notifikasi & Sinyal War</h2>
              <p className="text-xs text-muted-foreground">Dapatkan alert 15 menit sebelum kuota tiket dibuka.</p>
            </div>
          </div>

          <div className="space-y-4">
            <label className="flex items-center justify-between cursor-pointer">
              <div>
                <p className="text-xs font-bold text-foreground">Sinyal WhatsApp Tiket War</p>
                <p className="text-[11px] text-muted-foreground">Kirim broadcast otomatis saat antrean dibuka.</p>
              </div>
              <input
                type="checkbox"
                checked={waNotifications}
                onChange={(e) => setWaNotifications(e.target.checked)}
                className="size-5 rounded border-white/20 bg-black accent-war-gold"
              />
            </label>

            <label className="flex items-center justify-between cursor-pointer">
              <div>
                <p className="text-xs font-bold text-foreground">Two-Factor Authentication (2FA)</p>
                <p className="text-[11px] text-muted-foreground">Lindungi akun dari upaya pembajakan tiket dengan OTP.</p>
              </div>
              <input
                type="checkbox"
                checked={twoFactor}
                onChange={(e) => setTwoFactor(e.target.checked)}
                className="size-5 rounded border-white/20 bg-black accent-war-gold"
              />
            </label>
          </div>
        </section>

        {/* Submit */}
        <div className="flex justify-end gap-3 pt-4">
          <Button
            disabled
            type="submit"
            size="lg"
            title="Penyimpanan profil belum tersedia"
            className="rounded-xl bg-primary px-8 font-bold text-primary-foreground hover:bg-war-gold-bright shadow-[0_0_20px_rgba(240,180,41,0.2)]"
          >
            <Save className="size-4 mr-2" /> Penyimpanan Belum Tersedia
          </Button>
        </div>
      </form>
    </main>
  )
}
