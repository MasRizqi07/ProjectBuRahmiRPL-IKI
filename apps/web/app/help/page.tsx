'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  ChevronDown,
  CreditCard,
  Flame,
  MessageCircle,
  QrCode,
  RotateCcw,
  Search,
} from 'lucide-react'
import { Button } from '@/components/ui/button'

const topics = [
  {
    icon: Flame,
    title: 'Panduan & Trik War Tiket',
    description: 'Strategi koneksi low-latency, tips antrean adil, dan aturan anti-bot.',
    count: '8 Artikel',
    color: 'text-war-gold',
  },
  {
    icon: CreditCard,
    title: 'Pembayaran & Hold Kuota',
    description: 'Cara kerja 15-minute reservation hold, QRIS instan, dan Virtual Account.',
    count: '6 Artikel',
    color: 'text-blue-400',
  },
  {
    icon: QrCode,
    title: 'E-Ticket & Penukaran Gelang',
    description: 'Penggunaan dynamic QR rolling code, akses gate venue, dan anti-screenshot.',
    count: '10 Artikel',
    color: 'text-emerald-400',
  },
  {
    icon: RotateCcw,
    title: 'Refund & Sengketa Transaksi',
    description: 'Kebijakan pembatalan resmi promotor, penanganan double charge, dan dispute.',
    count: '5 Artikel',
    color: 'text-purple-400',
  },
]

const faqs = [
  {
    q: 'Bagaimana cara memenangkan war tiket konser di War Ticket?',
    a: 'Pastikan Anda telah mengisi dan memverifikasi NIK di menu Pengaturan Akun sebelum war dimulai. Masuk ke halaman waiting room minimal 5 menit sebelum penjualan dibuka, dan jangan pernah me-refresh halaman saat antrean berlangsung.',
  },
  {
    q: 'Berapa lama tiket saya ditahan (hold) saat proses pembayaran?',
    a: 'Begitu Anda berhasil memilih tier tiket dan menekan tombol lanjut, sistem server-side kami akan me-reserve kuota tiket Anda selama 15:00 menit penuh. Selama periode ini, tiket Anda tidak dapat direbut oleh pembeli lain.',
  },
  {
    q: 'Mengapa kode QR pada E-Ticket selalu berubah setiap 30 detik?',
    a: 'Ini adalah fitur keamanan Anti-Screenshot War Ticket. QR code dinamis mencegah praktik calo dan pemalsuan tiket. Anda cukup menunjukkan E-Ticket langsung dari browser atau smartphone Anda di pintu gate masuk konser.',
  },
  {
    q: 'Apakah saya bisa memindahtangankan tiket ke orang lain?',
    a: 'Bisa. Fitur transfer tiket tersedia di menu Tiket Saya hingga H-3 sebelum konser dengan mengisi NIK dan email penerima baru secara resmi.',
  },
]

export default function HelpCenterPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0)

  const filteredFaqs = faqs.filter(
    (f) =>
      f.q.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.a.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <main className="container-shell py-8 sm:py-12 space-y-12 max-w-5xl">
      {/* Hero Header & Search */}
      <section className="glass-panel relative overflow-hidden rounded-3xl p-8 sm:p-14 border border-white/10 text-center">
        <div className="absolute -top-24 -left-24 size-72 rounded-full bg-war-gold/15 blur-3xl pointer-events-none" />
        
        <div className="relative z-10 max-w-2xl mx-auto space-y-4">
          <span className="section-label mx-auto">PUSAT BANTUAN RESMI</span>
          <h1 className="font-display text-4xl sm:text-6xl tracking-wide text-foreground">
            ADA YANG BISA KAMI BANTU?
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
            Temukan jawaban instan mengenai perang tiket, sistem reservasi hold, dynamic QR, dan perlindungan pembeli.
          </p>

          {/* Search Box */}
          <div className="relative mt-6">
            <Search className="absolute left-4 top-1/2 size-5 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Ketik kata kunci pertanyaan (misal: refund, hold, QR code, NIK)..."
              className="w-full rounded-2xl border border-white/15 bg-black/60 pl-12 pr-4 py-4 text-xs sm:text-sm text-foreground placeholder:text-muted-foreground focus:outline-hidden focus:border-war-gold focus:ring-1 focus:ring-war-gold/40 shadow-xl"
            />
          </div>
        </div>
      </section>

      {/* Topic Categories Grid */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {topics.map((topic) => {
          const Icon = topic.icon
          return (
            <div
              key={topic.title}
              className="rounded-3xl border border-white/8 bg-[#141413] p-6 hover:border-war-gold/40 transition-all flex flex-col justify-between group shadow-lg cursor-pointer"
            >
              <div>
                <div className={`flex size-11 items-center justify-center rounded-2xl bg-white/5 ${topic.color} border border-white/10`}>
                  <Icon className="size-5" />
                </div>
                <h3 className="mt-4 font-display text-xl tracking-wide text-foreground group-hover:text-war-gold transition">
                  {topic.title}
                </h3>
                <p className="mt-1.5 text-xs text-muted-foreground leading-relaxed">
                  {topic.description}
                </p>
              </div>

              <span className="mt-4 block font-mono text-[11px] font-bold text-muted-foreground">
                {topic.count}
              </span>
            </div>
          )
        })}
      </section>

      {/* FAQ Accordion Section */}
      <section className="rounded-3xl border border-white/10 bg-[#141413] p-6 sm:p-10 space-y-6">
        <div className="border-b border-white/8 pb-4">
          <span className="text-xs font-bold uppercase tracking-widest text-war-gold">
            PERTANYAAN SERING DIAJUKAN (FAQ)
          </span>
          <h2 className="mt-1 font-display text-3xl text-foreground">
            Bantuan Cepat & Panduan Tiket
          </h2>
        </div>

        <div className="space-y-3">
          {filteredFaqs.map((faq, index) => {
            const isOpen = openFaqIndex === index
            return (
              <div
                key={faq.q}
                className="rounded-2xl border border-white/8 bg-black/40 overflow-hidden transition"
              >
                <button
                  onClick={() => setOpenFaqIndex(isOpen ? null : index)}
                  className="flex w-full items-center justify-between p-5 text-left text-xs sm:text-sm font-bold text-foreground hover:text-war-gold transition"
                >
                  <span>{faq.q}</span>
                  <ChevronDown className={`size-4 shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180 text-war-gold' : 'text-muted-foreground'}`} />
                </button>
                {isOpen && (
                  <div className="border-t border-white/8 px-5 pb-5 pt-3 text-xs sm:text-sm text-muted-foreground leading-relaxed">
                    {faq.a}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </section>

      {/* Need Live Support Banner */}
      <section className="rounded-3xl border border-war-gold/30 bg-linear-to-r from-war-gold/10 via-[#161514] to-black p-8 flex flex-col sm:flex-row items-center justify-between gap-6">
        <div>
          <h3 className="font-display text-2xl sm:text-3xl text-foreground">
            Masih Mengalami Kendala Tiket?
          </h3>
          <p className="text-xs text-muted-foreground mt-1">
            Tim Response Team War Ticket standby 24/7 untuk membantu masalah transaksi dan sengketa order.
          </p>
        </div>
        <Button asChild className="rounded-xl bg-primary px-7 py-5 font-bold text-primary-foreground hover:bg-war-gold-bright shrink-0 shadow-[0_0_20px_rgba(240,180,41,0.25)]">
          <Link href="/admin/disputes">
            <MessageCircle className="size-4 mr-2" /> Ajukan Laporan / Tiket Bantuan
          </Link>
        </Button>
      </section>
    </main>
  )
}
