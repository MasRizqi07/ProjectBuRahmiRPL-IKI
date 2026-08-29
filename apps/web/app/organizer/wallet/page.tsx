'use client'

import {
  ArrowDownRight,
  ArrowUpRight,
  Lock,
  Wallet,
} from 'lucide-react'
import { CapabilityNotice } from '@/components/feedback/capability-notice'
import { Button } from '@/components/ui/button'

const settlements = [
  { id: 'SET-9910', date: '28 Agu 2026', amount: 5000000000, bank: 'BCA (0881928312)', status: 'success', desc: 'Pencairan Termin 1 - Coldplay Jakarta' },
  { id: 'SET-9908', date: '15 Agu 2026', amount: 3500000000, bank: 'Mandiri (1370019283)', status: 'success', desc: 'Pencairan Presale - Dewa 19 All Stars' },
  { id: 'SET-9901', date: '01 Agu 2026', amount: 1200000000, bank: 'BCA (0881928312)', status: 'success', desc: 'Settlement Final - Pamungkas Acoustic' },
]

export default function OrganizerWalletPage() {
  const formatRupiah = (val: number) =>
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val)

  return (
    <div className="space-y-8 max-w-7xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-white/10 pb-6">
        <div>
          <span className="section-label">TREASURY & SETTLEMENT</span>
          <h1 className="mt-2 font-display text-4xl sm:text-5xl tracking-wide text-foreground">
            DOMPET & PENCAIRAN PROMOTOR
          </h1>
          <p className="text-xs text-muted-foreground">
            Kelola saldo penjualan tiket, penarikan dana ke rekening bank, dan pantau escrow settlement.
          </p>
        </div>

        <Button
          disabled
          title="Pencairan dana belum tersedia"
          className="rounded-xl bg-primary px-6 font-bold text-primary-foreground hover:bg-war-gold-bright shadow-[0_0_20px_rgba(240,180,41,0.25)]"
        >
          <ArrowUpRight className="size-4 mr-1.5" /> Tarik Dana Penjualan
        </Button>
      </div>

      <CapabilityNotice capability="organizerPayout" />

      {/* Balance Cards */}
      <section className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="rounded-3xl border border-war-gold/40 bg-linear-to-b from-[#221c0c] to-[#121211] p-8 shadow-[0_0_30px_rgba(240,180,41,0.15)] relative overflow-hidden">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-bold uppercase tracking-wider text-war-gold">Saldo Tersedia (Siap Cair)</span>
            <Wallet className="size-5 text-war-gold" />
          </div>
          <p className="mt-4 font-display text-4xl sm:text-5xl text-war-gold-bright font-bold">
            Rp 16.236.000.000
          </p>
          <p className="mt-2 text-xs text-status-success font-semibold">● Tersedia untuk ditarik instan</p>
        </div>

        <div className="rounded-3xl border border-white/10 bg-[#141413] p-8 shadow-xl">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-bold uppercase tracking-wider">Dana Escrow Tertahan</span>
            <Lock className="size-5 text-muted-foreground" />
          </div>
          <p className="mt-4 font-display text-3xl sm:text-4xl text-foreground">
            Rp 2.214.000.000
          </p>
          <p className="mt-2 text-xs text-muted-foreground">Otomatis rilis setelah event selesai (H+1)</p>
        </div>

        <div className="rounded-3xl border border-white/10 bg-[#141413] p-8 shadow-xl">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-bold uppercase tracking-wider">Total Dana Telah Ditarik</span>
            <ArrowDownRight className="size-5 text-blue-400" />
          </div>
          <p className="mt-4 font-display text-3xl sm:text-4xl text-foreground">
            Rp 9.700.000.000
          </p>
          <p className="mt-2 text-xs text-muted-foreground">3 Transaksi Settlement Sukses</p>
        </div>
      </section>

      {/* Linked Bank Accounts */}
      <section className="rounded-3xl border border-white/10 bg-[#141413] p-6 sm:p-8 space-y-4">
        <h3 className="font-display text-2xl text-foreground">Rekening Bank Terdaftar</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex items-center justify-between rounded-2xl border border-war-gold/40 bg-black/40 p-5">
            <div className="flex items-center gap-3.5">
              <div className="flex size-11 items-center justify-center rounded-xl bg-black border border-white/10 text-war-gold font-bold">
                BCA
              </div>
              <div>
                <p className="text-xs font-bold text-foreground">PT PROMOTOR SUKSES MANDIRI</p>
                <p className="font-mono text-xs text-muted-foreground">0881-928-312 (BCA Cabang Sudirman)</p>
              </div>
            </div>
            <span className="rounded-full bg-war-gold px-2.5 py-0.5 text-[10px] font-black text-black">
              UTAMA
            </span>
          </div>

          <div className="flex items-center justify-between rounded-2xl border border-white/8 bg-black/20 p-5">
            <div className="flex items-center gap-3.5">
              <div className="flex size-11 items-center justify-center rounded-xl bg-black border border-white/10 text-blue-400 font-bold">
                MNDR
              </div>
              <div>
                <p className="text-xs font-bold text-foreground">PT PROMOTOR SUKSES MANDIRI</p>
                <p className="font-mono text-xs text-muted-foreground">1370-019-283-491 (Mandiri Plaza)</p>
              </div>
            </div>
            <span className="text-[11px] text-muted-foreground">Sekunder</span>
          </div>
        </div>
      </section>

      {/* Settlement History Table */}
      <section className="rounded-3xl border border-white/10 bg-[#141413] p-6 sm:p-8 space-y-6">
        <h3 className="font-display text-2xl text-foreground">Riwayat Pencairan Dana</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-white/10 text-muted-foreground">
                <th className="pb-3 uppercase font-bold">No. Referensi</th>
                <th className="pb-3 uppercase font-bold">Tanggal</th>
                <th className="pb-3 uppercase font-bold">Keterangan</th>
                <th className="pb-3 uppercase font-bold">Rekening Tujuan</th>
                <th className="pb-3 uppercase font-bold">Jumlah Pencairan</th>
                <th className="pb-3 uppercase font-bold text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-foreground">
              {settlements.map((item) => (
                <tr key={item.id} className="hover:bg-white/4">
                  <td className="py-4 font-mono font-bold text-war-gold">{item.id}</td>
                  <td className="py-4 text-muted-foreground">{item.date}</td>
                  <td className="py-4">{item.desc}</td>
                  <td className="py-4 text-muted-foreground">{item.bank}</td>
                  <td className="py-4 font-mono font-bold text-foreground">{formatRupiah(item.amount)}</td>
                  <td className="py-4 text-right">
                    <span className="rounded-full bg-status-success/20 text-status-success px-2.5 py-1 text-[10px] font-bold">
                      BERHASIL
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

    </div>
  )
}
