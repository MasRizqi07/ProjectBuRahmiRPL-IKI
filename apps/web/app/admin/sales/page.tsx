'use client'

import { AdminSidebar } from '@/components/admin-sidebar'

export default function SalesAdminPage() {
  return (
    <div className="flex bg-background min-h-screen">
      <AdminSidebar />

      <main className="flex-1 overflow-auto">
        <div className="p-8 space-y-8">
          <div>
            <h1 className="font-display text-3xl font-black text-foreground mb-2">Data Penjualan</h1>
            <p className="text-zinc-400">Analisis penjualan dan laporan</p>
          </div>

          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-12 text-center">
            <p className="text-zinc-400">Detail penjualan akan ditampilkan di sini</p>
          </div>
        </div>
      </main>
    </div>
  )
}
