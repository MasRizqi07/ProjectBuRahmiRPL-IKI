import { redirect } from 'next/navigation'
import { TicketOrderCard } from '@/components/account/ticket-order-card'
import { EmptyState } from '@/components/feedback/empty-state'
import { PageShell } from '@/components/layout/page-shell'
import { getUserOrders } from '@/lib/queries/orders'
import { isSupabaseConfigured } from '@/lib/supabase/config'
import { createClient } from '@/lib/supabase/server'

export default async function MyTicketsPage() {
  if (!isSupabaseConfigured()) redirect('/login?callbackUrl=/my-tickets')
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login?callbackUrl=/my-tickets')
  const orders = await getUserOrders()

  return (
    <PageShell eyebrow="Akun Anda" title="Tiket saya" description="Seluruh pesanan dan tiket yang terhubung dengan akun ini.">
      {orders.length ? <div className="grid gap-5">{orders.map((order) => <TicketOrderCard key={order.id} order={order} />)}</div> : <EmptyState title="Belum ada tiket" description="Saat tiket berhasil dibeli, detail event dan kode tiket akan tersedia di halaman ini." action={{ href: '/concerts', label: 'Jelajahi konser' }} />}
    </PageShell>
  )
}
