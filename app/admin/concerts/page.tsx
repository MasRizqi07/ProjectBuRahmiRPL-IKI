'use client'

import { AdminSidebar } from '@/components/admin-sidebar'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'

export default function ConcertsAdminPage() {
  return (
    <div className="flex bg-background min-h-screen">
      <AdminSidebar />

      <main className="flex-1 overflow-auto">
        <div className="p-8 space-y-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-black text-foreground mb-2">Manajemen Konser</h1>
              <p className="text-zinc-400">Kelola konser dan tiket</p>
            </div>
            <Button className="bg-amber-400 hover:bg-amber-500 text-zinc-950 font-bold gap-2">
              <Plus size={20} />
              Tambah Konser
            </Button>
          </div>

          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-12 text-center">
            <p className="text-zinc-400">Fitur manajemen konser akan ditampilkan di sini</p>
          </div>
        </div>
      </main>
    </div>
  )
}
