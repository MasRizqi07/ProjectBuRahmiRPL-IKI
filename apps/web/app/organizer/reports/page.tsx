'use client'

import {
  FileSpreadsheet,
  FileText,
} from 'lucide-react'
import { CapabilityNotice } from '@/components/feedback/capability-notice'
import { Button } from '@/components/ui/button'

export default function OrganizerReportsPage() {
  return (
    <div className="space-y-8 max-w-7xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-white/10 pb-6">
        <div>
          <span className="section-label">FINANCIAL & SALES INTELLIGENCE</span>
          <h1 className="mt-2 font-display text-4xl sm:text-5xl tracking-wide text-foreground">
            LAPORAN PENJUALAN & AUDIT KEUANGAN
          </h1>
          <p className="text-xs text-muted-foreground">
            Ekspor rekapitulasi transaksi tiket, rincian biaya platform, dan distribusi metode pembayaran.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            disabled
            title="Ekspor laporan belum tersedia"
            variant="outline"
            className="rounded-xl border-white/15 bg-white/5 font-bold text-xs hover:border-war-gold/40"
          >
            <FileSpreadsheet className="size-4 mr-1.5 text-status-success" /> Export CSV
          </Button>
          <Button
            disabled
            title="Ekspor laporan belum tersedia"
            className="rounded-xl bg-primary font-bold text-xs text-primary-foreground hover:bg-war-gold-bright shadow-[0_0_15px_rgba(240,180,41,0.2)]"
          >
            <FileText className="size-4 mr-1.5" /> Unduh Laporan PDF
          </Button>
        </div>
      </div>

      <CapabilityNotice capability="organizerReportExport" />

      {/* Top Level Summary Cards */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-3xl border border-white/10 bg-[#141413] p-6 shadow-xl">
          <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Total Penjualan Kotor (GMV)</span>
          <p className="mt-2 font-display text-3xl text-war-gold-bright">Rp 18.450.000.000</p>
          <p className="mt-1 text-xs text-status-success">3.300 Tiket Terjual</p>
        </div>

        <div className="rounded-3xl border border-white/10 bg-[#141413] p-6 shadow-xl">
          <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Biaya Gateway & Platform</span>
          <p className="mt-2 font-display text-3xl text-foreground">Rp 369.000.000</p>
          <p className="mt-1 text-xs text-muted-foreground">2.0% Fee Standar</p>
        </div>

        <div className="rounded-3xl border border-white/10 bg-[#141413] p-6 shadow-xl">
          <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Pajak Hiburan Terkumpul</span>
          <p className="mt-2 font-display text-3xl text-foreground">Rp 1.845.000.000</p>
          <p className="mt-1 text-xs text-muted-foreground">10% Pajak Daerah (PB1)</p>
        </div>

        <div className="rounded-3xl border border-white/10 bg-[#141413] p-6 shadow-xl">
          <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Pendapatan Bersih Siap Cair</span>
          <p className="mt-2 font-display text-3xl text-status-success">Rp 16.236.000.000</p>
          <p className="mt-1 text-xs text-muted-foreground">Di Dompet Promotor</p>
        </div>
      </section>

      {/* Breakdown: Payment Channels & City Demographics */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Payment Channels */}
        <div className="rounded-3xl border border-white/10 bg-[#141413] p-6 sm:p-8 space-y-4 shadow-xl">
          <h3 className="font-display text-2xl text-foreground">Kanal Metode Pembayaran</h3>
          <p className="text-xs text-muted-foreground">Breakdown gateway transaksi pembeli tiket.</p>

          <div className="space-y-3 pt-2">
            {[
              { name: 'QRIS Instant (GoPay, OVO, ShopeePay)', share: '48%', amount: 'Rp 8.856.000.000', color: 'bg-emerald-400' },
              { name: 'BCA Virtual Account', share: '32%', amount: 'Rp 5.904.000.000', color: 'bg-war-gold' },
              { name: 'Mandiri Livin & BRI VA', share: '12%', amount: 'Rp 2.214.000.000', color: 'bg-blue-400' },
              { name: 'Kartu Kredit / Debit Online', share: '8%', amount: 'Rp 1.476.000.000', color: 'bg-purple-400' },
            ].map((ch) => (
              <div key={ch.name} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-foreground font-semibold">{ch.name}</span>
                  <span className="font-mono text-muted-foreground">{ch.share} ({ch.amount})</span>
                </div>
                <div className="h-2 w-full rounded-full bg-white/8 overflow-hidden">
                  <div className={`h-full ${ch.color}`} style={{ width: ch.share }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Demographics by City */}
        <div className="rounded-3xl border border-white/10 bg-[#141413] p-6 sm:p-8 space-y-4 shadow-xl">
          <h3 className="font-display text-2xl text-foreground">Demografi Kota Pembeli</h3>
          <p className="text-xs text-muted-foreground">Distribusi asal kota fans yang menghadiri konser.</p>

          <div className="space-y-3 pt-2">
            {[
              { city: 'Jabodetabek (Jakarta Raya)', share: '62%', count: '2.046 Pembeli', color: 'bg-war-gold' },
              { city: 'Bandung & Jawa Barat', share: '18%', count: '594 Pembeli', color: 'bg-cyan-400' },
              { city: 'Surabaya & Jawa Timur', share: '12%', count: '396 Pembeli', color: 'bg-orange-400' },
              { city: 'Bali & Kota Lainnya', share: '8%', count: '264 Pembeli', color: 'bg-pink-400' },
            ].map((item) => (
              <div key={item.city} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-foreground font-semibold">{item.city}</span>
                  <span className="font-mono text-muted-foreground">{item.share} ({item.count})</span>
                </div>
                <div className="h-2 w-full rounded-full bg-white/8 overflow-hidden">
                  <div className={`h-full ${item.color}`} style={{ width: item.share }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
