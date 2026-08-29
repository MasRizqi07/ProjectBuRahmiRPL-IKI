import Link from 'next/link'
import {
  Flame,
  ShieldCheck,
} from 'lucide-react'
import { NewsletterForm } from '@/components/forms/newsletter-form'

export function SiteFooter() {
  return (
    <footer className="border-t border-white/8 bg-[#090909] text-foreground">
      {/* Top Banner / Newsletter */}
      <div className="border-b border-white/8 bg-linear-to-r from-black via-white/2 to-black py-12">
        <div className="container-shell flex flex-col items-center justify-between gap-6 lg:flex-row">
          <div className="text-center lg:text-left">
            <span className="inline-flex items-center gap-2 rounded-full border border-war-gold/30 bg-war-gold/10 px-3 py-1 text-[11px] font-bold text-war-gold-bright uppercase tracking-wider">
              <Flame className="size-3.5" /> JANGAN PERNAH KETINGGALAN WAR
            </span>
            <h3 className="mt-3 font-display text-3xl sm:text-4xl tracking-wide text-foreground">
              Dapatkan Notifikasi Presale & Flash Drop
            </h3>
            <p className="mt-1 text-xs sm:text-sm text-muted-foreground">
              Daftarkan email atau WhatsApp kamu untuk sinyal tiket 15 menit sebelum perang dimulai.
            </p>
          </div>

          <NewsletterForm />
        </div>
      </div>

      {/* Main Footer Links */}
      <div className="container-shell grid grid-cols-2 gap-8 py-14 md:grid-cols-5">
        {/* Brand Col */}
        <div className="col-span-2 space-y-4">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex size-8 items-center justify-center rounded-xl border border-war-gold/40 bg-war-gold/10 font-display text-lg font-bold text-war-gold">
              WT
            </div>
            <span className="font-display text-2xl tracking-wide text-war-gold">WAR TICKET</span>
          </Link>
          <p className="max-w-sm text-xs leading-relaxed text-muted-foreground">
            Platform ticketing dengan antrean per sesi penjualan, reservasi idempotent, kursi teralokasi, dan konfirmasi pembayaran terverifikasi.
          </p>

          <div className="flex items-center gap-3 pt-2">
            <div className="flex items-center gap-2 rounded-full border border-status-success/30 bg-status-success/10 px-3 py-1 text-[11px] font-bold text-status-success">
              <span className="pulse-dot size-1.5 rounded-full bg-status-success" /> Checkout Fail-Closed
            </div>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <ShieldCheck className="size-4 text-war-gold" /> Audit Trail Aktif
            </div>
          </div>
        </div>

        {/* Col 1: Discovery */}
        <div className="space-y-3">
          <p className="text-xs font-black uppercase tracking-wider text-foreground">Jelajahi</p>
          <ul className="space-y-2 text-xs text-muted-foreground">
            <li><Link href="/concerts" className="hover:text-war-gold transition">Semua Konser</Link></li>
            <li><Link href="/promos" className="hover:text-war-gold transition">Flash Sale & Promos</Link></li>
            <li><Link href="/elite" className="hover:text-war-gold transition">War Ticket Elite VIP</Link></li>
            <li><Link href="/elite/lounge" className="hover:text-war-gold transition">Vanguard Lounge</Link></li>
            <li><Link href="/community" className="hover:text-war-gold transition">Live War Room Status</Link></li>
          </ul>
        </div>

        {/* Col 2: Promoters & Partners */}
        <div className="space-y-3">
          <p className="text-xs font-black uppercase tracking-wider text-foreground">Promotor & Partner</p>
          <ul className="space-y-2 text-xs text-muted-foreground">
            <li><Link href="/partner" className="hover:text-war-gold transition">Gabung Jadi Partner</Link></li>
            <li><Link href="/organizer" className="hover:text-war-gold transition">Command Center</Link></li>
            <li><Link href="/organizer/events/new" className="hover:text-war-gold transition">Buat Event Baru</Link></li>
            <li><Link href="/organizer/seating-analytics" className="hover:text-war-gold transition">Seating Analytics</Link></li>
            <li><Link href="/scanner" className="hover:text-war-gold transition">Gate QR Scanner</Link></li>
          </ul>
        </div>

        {/* Col 3: Support & Legal */}
        <div className="space-y-3">
          <p className="text-xs font-black uppercase tracking-wider text-foreground">Bantuan & Keamanan</p>
          <ul className="space-y-2 text-xs text-muted-foreground">
            <li><Link href="/help" className="hover:text-war-gold transition">Pusat Bantuan & FAQ</Link></li>
            <li><Link href="/notifications" className="hover:text-war-gold transition">Pusat Notifikasi</Link></li>
            <li><Link href="/dashboard" className="hover:text-war-gold transition">Dashboard Akun</Link></li>
            <li><Link href="/admin" className="hover:text-war-gold transition">Admin Portal</Link></li>
            <li><Link href="/admin/security" className="hover:text-war-gold transition">Security Protocol</Link></li>
          </ul>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-white/8 bg-black/60 py-6">
        <div className="container-shell flex flex-col items-center justify-between gap-4 text-xs text-muted-foreground sm:flex-row">
          <p>© {new Date().getFullYear()} WAR TICKET. Dikembangkan untuk Performa Tanpa Kompromi.</p>
          <div className="flex items-center gap-6">
            <Link href="/legal/terms" className="hover:text-foreground">Syarat & Ketentuan</Link>
            <Link href="/legal/privacy" className="hover:text-foreground">Kebijakan Privasi</Link>
            <Link href="/legal/refund" className="hover:text-foreground">Kebijakan Refund</Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
