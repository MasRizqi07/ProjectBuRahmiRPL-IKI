'use client'

import { AdminSidebar } from '@/components/admin-sidebar'
import { TrendingUp, TrendingDown } from 'lucide-react'
import dynamic from 'next/dynamic'

const AdminCharts = dynamic(() => import('@/components/admin/charts'), {
  loading: () => (
    <div className="space-y-8">
      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 h-64 bg-zinc-900 animate-pulse rounded-xl" />
        <div className="h-64 bg-zinc-900 animate-pulse rounded-xl" />
      </div>
      <div className="h-64 bg-zinc-900 animate-pulse rounded-xl" />
    </div>
  ),
  ssr: false
})

const transactions = [
  {
    id: 1,
    name: 'Budi Santoso',
    concert: 'Coldplay',
    seat: 'A-123',
    total: 1850000,
    status: 'Berhasil',
    time: '14:32',
  },
  {
    id: 2,
    name: 'Siti Nurhaliza',
    concert: 'BLACKPINK',
    seat: 'B-456',
    total: 2150000,
    status: 'Berhasil',
    time: '14:28',
  },
  {
    id: 3,
    name: 'Ahmad Wijaya',
    concert: 'Tulus',
    seat: 'C-789',
    total: 750000,
    status: 'Pending',
    time: '14:15',
  },
  {
    id: 4,
    name: 'Rini Puspita',
    concert: 'Dewa 19',
    seat: 'D-012',
    total: 850000,
    status: 'Gagal',
    time: '13:52',
  },
]

const topConcerts = [
  { name: 'Coldplay', sold: 8500, total: 10000, revenue: 9200000 },
  { name: 'BLACKPINK', sold: 12000, total: 12000, revenue: 8800000 },
  { name: 'Rich Brian', sold: 4500, total: 6000, revenue: 5800000 },
  { name: 'Dewa 19', sold: 3200, total: 8000, revenue: 4200000 },
  { name: 'Tulus', sold: 2100, total: 7000, revenue: 3600000 },
]

interface KPICardProps {
  label: string
  value: string | number
  trend?: number
  isCurrency?: boolean
}

function KPICard({ label, value, trend, isCurrency }: KPICardProps) {
  const isPositive = trend && trend > 0

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
      <p className="text-xs font-medium text-zinc-500 mb-2">{label}</p>
      <div className="flex items-baseline justify-between">
        <p className="text-2xl font-black text-foreground">
          {isCurrency ? 'Rp' : ''} {typeof value === 'number' ? value.toLocaleString('id-ID') : value}
        </p>
        {trend !== undefined && (
          <div className={`flex items-center gap-1 text-sm font-semibold ${isPositive ? 'text-emerald-400' : 'text-red-400'}`}>
            {isPositive ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
            {Math.abs(trend)}%
          </div>
        )}
      </div>
    </div>
  )
}

export default function AdminPage() {
  return (
    <div className="flex bg-background min-h-screen">
      <AdminSidebar />

      <main className="flex-1 overflow-auto">
        <div className="p-8 space-y-8">
          {/* Header */}
          <div>
            <h1 className="font-display text-3xl font-black text-foreground mb-2">Overview</h1>
            <p className="text-zinc-400 font-body">Ringkasan performa WAR TICKET</p>
          </div>

          {/* KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <KPICard label="Total Tiket Terjual" value={47821} trend={12} />
            <KPICard label="Revenue" value={58200000} trend={12} isCurrency />
            <KPICard label="Konser Aktif" value={12} trend={5} />
            <KPICard label="Rata-rata Queue" value={4200} trend={-3} />
          </div>

          <AdminCharts />

          {/* Tables Grid */}
          <div className="grid lg:grid-cols-2 gap-8">
            {/* Recent Transactions */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
              <h2 className="font-display font-bold text-foreground mb-4">Transaksi Terbaru</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-zinc-800">
                      <th className="text-left py-2 px-2 text-xs font-semibold text-zinc-500">Nama</th>
                      <th className="text-left py-2 px-2 text-xs font-semibold text-zinc-500">Konser</th>
                      <th className="text-left py-2 px-2 text-xs font-semibold text-zinc-500">Total</th>
                      <th className="text-left py-2 px-2 text-xs font-semibold text-zinc-500">Status</th>
                      <th className="text-left py-2 px-2 text-xs font-semibold text-zinc-500">Waktu</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.map((tx) => (
                      <tr key={tx.id} className="border-b border-zinc-800/50 hover:bg-zinc-800/30 transition-colors font-body">
                        <td className="py-3 px-2 text-foreground">{tx.name}</td>
                        <td className="py-3 px-2 text-zinc-400">{tx.concert}</td>
                        <td className="py-3 px-2 font-semibold text-amber-400 font-mono">Rp {tx.total.toLocaleString('id-ID')}</td>
                        <td className="py-3 px-2">
                          <span
                            className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                              tx.status === 'Berhasil'
                                ? 'bg-emerald-500/20 text-emerald-300'
                                : tx.status === 'Pending'
                                  ? 'bg-amber-500/20 text-amber-300'
                                  : 'bg-red-500/20 text-red-300'
                            }`}
                          >
                            {tx.status}
                          </span>
                        </td>
                        <td className="py-3 px-2 text-zinc-500">{tx.time}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Top Concerts */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
              <h2 className="font-display font-bold text-foreground mb-4">Top 5 Konser</h2>
              <div className="space-y-4 font-body">
                {topConcerts.map((concert, idx) => {
                  const percentage = (concert.sold / concert.total) * 100
                  return (
                    <div key={idx}>
                      <div className="flex justify-between items-center mb-2">
                        <p className="font-semibold text-foreground">{concert.name}</p>
                        <p className="text-xs text-zinc-500">{concert.sold} / {concert.total}</p>
                      </div>
                      <div className="w-full h-2 bg-zinc-800 rounded-full overflow-hidden">
                        <progress
                          className="h-full w-full appearance-none bg-amber-400"
                          value={Math.round(percentage)}
                          max={100}
                          aria-label={`Penjualan ${concert.name}: ${Math.round(percentage)}%`}
                        />
                      </div>
                      <p className="text-xs text-zinc-500 mt-1 font-mono">Rp {concert.revenue.toLocaleString('id-ID')}</p>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
