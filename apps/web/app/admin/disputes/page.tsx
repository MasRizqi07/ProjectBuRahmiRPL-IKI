'use client'

import { useState } from 'react'
import {
  AlertCircle,
  Check,
  CheckCircle2,
  Clock,
  CreditCard,
  FileText,
  Filter,
  HelpCircle,
  MessageSquare,
  RotateCcw,
  Search,
  ShieldAlert,
  User,
  X,
} from 'lucide-react'
import { Button } from '@/components/ui/button'

interface Dispute {
  id: string
  orderId: string
  userName: string
  userEmail: string
  concert: string
  amount: number
  reason: string
  date: string
  status: 'pending' | 'resolved' | 'rejected'
}

const initialDisputes: Dispute[] = [
  {
    id: 'DSP-8821',
    orderId: 'WT-2026-X8910',
    userName: 'Budi Santoso',
    userEmail: 'budi.s@gmail.com',
    concert: 'Coldplay Live Jakarta 2026',
    amount: 3700000,
    reason: 'Terjadi double debit pada virtual account BCA saat proses hold checkout.',
    date: '28 Agu 2026, 14:20',
    status: 'pending',
  },
  {
    id: 'DSP-8819',
    orderId: 'WT-2026-X7712',
    userName: 'Anindya Putri',
    userEmail: 'anindya@yahoo.com',
    concert: 'BLACKPINK World Tour',
    amount: 1850000,
    reason: 'Pembayaran QRIS sukses tetapi status tiket di dashboard sempat pending lebih dari 15 menit.',
    date: '27 Agu 2026, 19:10',
    status: 'pending',
  },
  {
    id: 'DSP-8802',
    orderId: 'WT-2026-X6610',
    userName: 'Dimas Wicaksono',
    userEmail: 'dimas.w@gmail.com',
    concert: 'Dewa 19 Reunion Tour',
    amount: 750000,
    reason: 'Permintaan refund karena jadwal konser diundur oleh pihak promotor.',
    date: '25 Agu 2026, 11:00',
    status: 'resolved',
  },
]

export default function AdminDisputesPage() {
  const [disputes, setDisputes] = useState<Dispute[]>(initialDisputes)
  const [filter, setFilter] = useState<'all' | 'pending' | 'resolved' | 'rejected'>('all')
  const [actionAlert, setActionAlert] = useState<string | null>(null)

  const handleResolve = (id: string, action: 'approve' | 'reject') => {
    setDisputes((prev) =>
      prev.map((d) => (d.id === id ? { ...d, status: action === 'approve' ? 'resolved' : 'rejected' } : d))
    )
    setActionAlert(
      action === 'approve'
        ? `Sengketa #${id} disetujui. Dana refund berhasil diproses ke rekening pembeli!`
        : `Sengketa #${id} ditolak.`
    )
    setTimeout(() => setActionAlert(null), 3500)
  }

  const formatRupiah = (val: number) =>
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val)

  const filtered = disputes.filter((d) => (filter === 'all' ? true : d.status === filter))

  return (
    <div className="space-y-8 max-w-7xl">
      {/* Header */}
      <div className="border-b border-white/10 pb-6">
        <span className="section-label">CUSTOMER SUPPORT & RESOLUTION</span>
        <h1 className="mt-2 font-display text-4xl sm:text-5xl tracking-wide text-foreground">
          SISTEM SENGKETA & KLAIM REFUND
        </h1>
        <p className="text-xs text-muted-foreground">
          Kelola laporan kendala pembayaran pengguna, klaim pembatalan event resmi, dan adjudikasi transaksi.
        </p>
      </div>

      {actionAlert && (
        <div className="flex items-center gap-3 rounded-2xl border border-war-gold/40 bg-war-gold/10 p-4 text-war-gold animate-fade-up">
          <CheckCircle2 className="size-5" />
          <span className="text-xs font-bold">{actionAlert}</span>
        </div>
      )}

      {/* Filter Chips */}
      <div className="flex flex-wrap gap-2">
        {[
          { key: 'all', label: 'Semua Laporan' },
          { key: 'pending', label: 'Menunggu Review (Pending)' },
          { key: 'resolved', label: 'Selesai (Refund Sukses)' },
          { key: 'rejected', label: 'Ditolak' },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key as any)}
            className={`rounded-full px-4 py-2 text-xs font-bold transition-all ${
              filter === tab.key
                ? 'bg-war-gold text-black shadow-[0_0_15px_rgba(240,180,41,0.25)]'
                : 'border border-white/10 bg-white/4 text-muted-foreground hover:border-white/20 hover:text-foreground'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Disputes Cards List */}
      <div className="space-y-4">
        {filtered.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-white/10 p-12 text-center text-xs text-muted-foreground">
            Tidak ada tiket sengketa dalam filter ini.
          </div>
        ) : (
          filtered.map((item) => (
            <div
              key={item.id}
              className={`rounded-3xl border p-6 transition-all space-y-4 ${
                item.status === 'pending'
                  ? 'border-war-gold/40 bg-[#161514] shadow-xl'
                  : 'border-white/8 bg-[#141413]'
              }`}
            >
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-white/8 pb-4">
                <div className="flex items-center gap-3">
                  <span className="font-mono text-sm font-bold text-war-gold">{item.id}</span>
                  <span className="rounded-md bg-white/10 px-2 py-0.5 font-mono text-[11px] text-muted-foreground">
                    Order Ref: {item.orderId}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <span
                    className={`rounded-full px-3 py-1 text-[10px] font-black uppercase ${
                      item.status === 'pending'
                        ? 'bg-war-gold/20 text-war-gold border border-war-gold/40'
                        : item.status === 'resolved'
                        ? 'bg-status-success/20 text-status-success'
                        : 'bg-urgent-red/20 text-urgent-red'
                    }`}
                  >
                    {item.status === 'pending' ? 'MENUNGGU ADJUDIKASI' : item.status === 'resolved' ? 'REFUND DISETUJUI' : 'DITOLAK'}
                  </span>
                  <span className="text-[11px] font-mono text-muted-foreground">{item.date}</span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <span className="text-[10px] font-bold uppercase text-muted-foreground">Pelapor</span>
                  <p className="text-xs font-bold text-foreground mt-0.5">{item.userName}</p>
                  <p className="text-[11px] text-muted-foreground">{item.userEmail}</p>
                </div>

                <div>
                  <span className="text-[10px] font-bold uppercase text-muted-foreground">Event & Nominal Klaim</span>
                  <p className="text-xs font-bold text-foreground mt-0.5">{item.concert}</p>
                  <p className="text-xs font-mono font-bold text-war-gold-bright">{formatRupiah(item.amount)}</p>
                </div>

                <div>
                  <span className="text-[10px] font-bold uppercase text-muted-foreground">Alasan Sengketa</span>
                  <p className="text-xs text-muted-foreground leading-relaxed mt-0.5">{item.reason}</p>
                </div>
              </div>

              {item.status === 'pending' && (
                <div className="flex items-center justify-end gap-2 border-t border-white/8 pt-4">
                  <Button
                    onClick={() => handleResolve(item.id, 'reject')}
                    variant="outline"
                    className="rounded-xl border-white/15 text-xs text-muted-foreground hover:border-urgent-red/40 hover:text-urgent-red"
                  >
                    <X className="size-3.5 mr-1" /> Tolak Klaim
                  </Button>
                  <Button
                    onClick={() => handleResolve(item.id, 'approve')}
                    className="rounded-xl bg-status-success font-bold text-xs text-black hover:bg-emerald-400"
                  >
                    <Check className="size-3.5 mr-1" /> Setujui Refund Dana
                  </Button>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  )
}

