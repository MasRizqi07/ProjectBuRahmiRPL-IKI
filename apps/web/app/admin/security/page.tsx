'use client'

import {
  Lock,
  ShieldCheck,
  Smartphone,
  Unlock,
  Zap,
} from 'lucide-react'
import { CapabilityNotice } from '@/components/feedback/capability-notice'

export default function AdminSecurityPage() {
  const turnstileStrict = true
  const nikValidation = true
  const rateLimiter = true
  const twoFactorHighValue = true

  const blockedIps = [
    { ip: '185.220.101.5', reason: 'High-speed automated bot script (250 req/s)', count: '4.890 Hits', blockedAt: '5 menit lalu', country: 'RU' },
    { ip: '103.149.28.12', reason: 'Repeated credit card brute force attempts', count: '128 Hits', blockedAt: '20 menit lalu', country: 'ID' },
    { ip: '45.154.255.88', reason: 'Known residential proxy calo network', count: '1.240 Hits', blockedAt: '1 jam lalu', country: 'NL' },
  ]

  return (
    <div className="space-y-8 max-w-7xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-white/10 pb-6">
        <div>
          <span className="section-label">CYBER DEFENSE & ACCESS CONTROL</span>
          <h1 className="mt-2 font-display text-4xl sm:text-5xl tracking-wide text-foreground">
            SISTEM KEAMANAN & ANTI-BOT
          </h1>
          <p className="text-xs text-muted-foreground">
            Konfigurasi parameter proteksi calo tiket, mitigasi DDoS, dan firewall cerdas platform.
          </p>
        </div>

        <div className="flex items-center gap-2 rounded-2xl border border-status-success/30 bg-status-success/10 px-4 py-2 text-xs font-bold text-status-success">
          <ShieldCheck className="size-4" /> FIREWALL AKTIF (LEVEL MAKSIMAL)
        </div>
      </div>

      <CapabilityNotice capability="adminSecurityControls" />

      {/* Security Policies Toggle Cards */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="rounded-3xl border border-white/10 bg-[#141413] p-6 sm:p-8 flex items-start justify-between gap-4 shadow-xl">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <ShieldCheck className="size-5 text-war-gold" />
              <h3 className="font-display text-2xl text-foreground">Turnstile Strict Bot Protection</h3>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Tantangan CAPTCHA non-intrusif berbasis AI Cloudflare sebelum antrean dimulai untuk memfilter 100% script calo headless.
            </p>
          </div>
          <button
            disabled
            title="Kontrol keamanan belum tersedia"
            className={`relative h-7 w-12 cursor-not-allowed rounded-full p-1 opacity-60 ${turnstileStrict ? 'bg-war-gold' : 'bg-white/20'}`}
          >
            <div className={`size-5 rounded-full bg-black transition-transform ${turnstileStrict ? 'translate-x-5' : 'translate-x-0'}`} />
          </button>
        </div>

        <div className="rounded-3xl border border-white/10 bg-[#141413] p-6 sm:p-8 flex items-start justify-between gap-4 shadow-xl">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Lock className="size-5 text-emerald-400" />
              <h3 className="font-display text-2xl text-foreground">Wajib 1 NIK = 1 Transaksi</h3>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Kunci identitas kependudukan KTP resmi. Setiap NIK hanya dapat membeli tiket satu kali per konser untuk pemerataan kuota.
            </p>
          </div>
          <button
            disabled
            title="Kontrol keamanan belum tersedia"
            className={`relative h-7 w-12 cursor-not-allowed rounded-full p-1 opacity-60 ${nikValidation ? 'bg-war-gold' : 'bg-white/20'}`}
          >
            <div className={`size-5 rounded-full bg-black transition-transform ${nikValidation ? 'translate-x-5' : 'translate-x-0'}`} />
          </button>
        </div>

        <div className="rounded-3xl border border-white/10 bg-[#141413] p-6 sm:p-8 flex items-start justify-between gap-4 shadow-xl">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Zap className="size-5 text-orange-400" />
              <h3 className="font-display text-2xl text-foreground">Adaptive Rate Limiting</h3>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Maksimal 10 request per detik per alamat IP. Permintaan berlebih akan diarahkan ke antrean waiting room throttling.
            </p>
          </div>
          <button
            disabled
            title="Kontrol keamanan belum tersedia"
            className={`relative h-7 w-12 cursor-not-allowed rounded-full p-1 opacity-60 ${rateLimiter ? 'bg-war-gold' : 'bg-white/20'}`}
          >
            <div className={`size-5 rounded-full bg-black transition-transform ${rateLimiter ? 'translate-x-5' : 'translate-x-0'}`} />
          </button>
        </div>

        <div className="rounded-3xl border border-white/10 bg-[#141413] p-6 sm:p-8 flex items-start justify-between gap-4 shadow-xl">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Smartphone className="size-5 text-blue-400" />
              <h3 className="font-display text-2xl text-foreground">2FA Pembayaran &gt; Rp 5.000.000</h3>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Wajibkan konfirmasi OTP WhatsApp / SMS untuk transaksi dengan nominal tinggi untuk mencegah fraud kartu kredit curian.
            </p>
          </div>
          <button
            disabled
            title="Kontrol keamanan belum tersedia"
            className={`relative h-7 w-12 cursor-not-allowed rounded-full p-1 opacity-60 ${twoFactorHighValue ? 'bg-war-gold' : 'bg-white/20'}`}
          >
            <div className={`size-5 rounded-full bg-black transition-transform ${twoFactorHighValue ? 'translate-x-5' : 'translate-x-0'}`} />
          </button>
        </div>
      </section>

      {/* Blocked Threat IPs & Scalper Network */}
      <section className="rounded-3xl border border-white/10 bg-[#141413] p-6 sm:p-8 space-y-6 shadow-xl">
        <div className="flex items-center justify-between border-b border-white/8 pb-4">
          <div>
            <h3 className="font-display text-2xl text-foreground">Daftar IP Bot & Calo Terblokir Otomatis</h3>
            <p className="text-xs text-muted-foreground">Alamat IP yang diblokir oleh AI Firewall karena perilaku mencurigakan.</p>
          </div>
          <span className="rounded-full bg-urgent-red/10 border border-urgent-red/30 px-3 py-1 text-xs font-bold text-urgent-red">
            {blockedIps.length} IP Aktif Diblokir
          </span>
        </div>

        {blockedIps.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-white/10 p-8 text-center text-muted-foreground text-xs">
            Semua IP telah dibuka blokirnya.
          </div>
        ) : (
          <div className="space-y-3">
            {blockedIps.map((b) => (
              <div
                key={b.ip}
                className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 rounded-2xl border border-white/8 bg-black/40 p-4 hover:border-urgent-red/40 transition"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm font-bold text-urgent-red">{b.ip}</span>
                    <span className="rounded-sm bg-white/10 px-1.5 py-0.5 text-[9px] font-bold text-muted-foreground">{b.country}</span>
                    <span className="text-[10px] text-muted-foreground font-mono">● {b.count} Dihalau</span>
                  </div>
                  <p className="text-xs text-muted-foreground">{b.reason}</p>
                </div>

                <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
                  <span className="text-[10px] text-muted-foreground font-mono">{b.blockedAt}</span>
                  <button
                    disabled
                    title="Kontrol keamanan belum tersedia"
                    className="flex cursor-not-allowed items-center gap-1 rounded-xl border border-white/15 bg-white/5 px-3 py-1.5 text-xs font-semibold text-muted-foreground opacity-60"
                  >
                    <Unlock className="size-3.5" /> Buka Blokir
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
