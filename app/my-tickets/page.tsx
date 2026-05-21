import { Navbar } from '@/components/navbar'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

export default function MyTicketsPage() {
  return (
    <div className="min-h-screen bg-zinc-950">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <div className="text-center py-20 animate-fade-up">
          <h1 className="font-display text-4xl font-black text-foreground mb-4">
            Tiket Saya
          </h1>
          <p className="text-zinc-400 mb-8">
            Belum ada tiket yang dibeli. Mulai pesan konsermu sekarang!
          </p>
          <Link href="/concerts" aria-label="Buka halaman daftar konser">
            <Button 
              className="bg-amber-400 hover:bg-amber-500 text-zinc-950 font-bold"
              aria-label="Tombol jelajahi konser"
            >
              Jelajahi Konser
            </Button>
          </Link>
        </div>
      </main>
    </div>
  )
}
