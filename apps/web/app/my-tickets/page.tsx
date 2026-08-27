import { getUserOrders } from '@/lib/queries/orders'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Navbar } from '@/components/navbar'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { isSupabaseConfigured } from '@/lib/supabase/config'

export default async function MyTicketsPage() {
  if (!isSupabaseConfigured()) redirect('/login?callbackUrl=/my-tickets')

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login?callbackUrl=/my-tickets')

  const orders = await getUserOrders()

  return (
    <div className="min-h-screen bg-zinc-950">
      <Navbar />

      <main id="main-content" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-12 sm:pt-32">
        {orders.length === 0 ? (
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
        ) : (
          <div className="animate-fade-up">
            <h1 className="font-display text-4xl font-black text-foreground mb-8">
              Tiket Saya
            </h1>
            <div className="grid gap-6">
              {orders.map((order) => (
                <div key={order.id} className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
                  {/* Note: In a real app we'd display order details more beautifully. 
                      Since we just replaced static with dynamic, this is a basic render */}
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-bold text-xl text-white mb-2">{order.concerts?.title}</h3>
                      <p className="text-zinc-400 mb-1">{order.ticket_tiers?.name} - {order.quantity} Tiket</p>
                      <p className="text-sm text-zinc-500">Status: {order.status.toUpperCase()}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-mono font-bold text-lg text-white">Rp {order.total_price.toLocaleString('id-ID')}</p>
                      <p className="text-sm text-zinc-500 mt-1">Kode: {order.ticket_code}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
