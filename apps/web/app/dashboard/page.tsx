import Link from 'next/link'
import { ArrowRight, Bell, Crown, ShieldCheck, Ticket, User } from 'lucide-react'
import { DesignBackdrop } from '@/components/ui/design-backdrop'
import { Button } from '@/components/ui/button'
import { getViewer } from '@/lib/auth/viewer'
import { buyerRepository } from '@/lib/server/runtime'

export const metadata = { title: 'Dashboard Pengguna — WAR TICKET' }
export const dynamic = 'force-dynamic'

export default async function UserDashboardPage() {
  const viewer = await getViewer()
  let activeTickets = 0
  let completedTickets = 0
  if (viewer) {
    const tickets = await buyerRepository().listTickets(viewer.id)
    activeTickets = tickets.filter((ticket) => ticket.status === 'ACTIVE' && new Date(ticket.startsAt).getTime() >= Date.now()).length
    completedTickets = tickets.filter((ticket) => ticket.status === 'REDEEMED' || new Date(ticket.startsAt).getTime() < Date.now()).length
  }
  const name = viewer?.name ?? viewer?.email ?? 'Pembeli'

  return <main id="main-content" className="container-shell space-y-8 py-8 sm:py-12">
    <section className="glass-panel relative overflow-hidden rounded-3xl border border-white/10 p-8"><DesignBackdrop group="war_ticket_user_dashboard" index={0} imageClassName="opacity-30" overlayClassName="bg-linear-to-r from-black/95 via-black/80 to-black/55" /><div className="relative z-10"><span className="section-label">USER DASHBOARD</span><h1 className="mt-3 font-display text-5xl">SELAMAT DATANG, <span className="text-war-gold">{name.toUpperCase()}</span></h1><p className="mt-2 text-sm text-muted-foreground">Kelola tiket, profil, notifikasi, dan bantuan dari satu tempat.</p></div></section>
    <section className="grid gap-4 sm:grid-cols-3"><div className="rounded-2xl border border-white/10 bg-[#141413] p-6"><Ticket className="text-war-gold" /><p className="mt-4 text-xs uppercase text-muted-foreground">Tiket aktif</p><p className="font-display text-4xl">{activeTickets}</p></div><div className="rounded-2xl border border-white/10 bg-[#141413] p-6"><ShieldCheck className="text-status-success" /><p className="mt-4 text-xs uppercase text-muted-foreground">Tiket selesai</p><p className="font-display text-4xl">{completedTickets}</p></div><div className="rounded-2xl border border-white/10 bg-[#141413] p-6"><Crown className="text-war-gold" /><p className="mt-4 text-xs uppercase text-muted-foreground">Role akun</p><p className="font-display text-2xl">{viewer?.platformRole ?? 'DEMO'}</p></div></section>
    <section className="grid gap-4 sm:grid-cols-3">{[{ href: '/my-tickets', title: 'Tiket Saya', description: 'QR dinamis dan PDF', icon: Ticket }, { href: '/profile', title: 'Profil', description: 'Identitas dan preferensi', icon: User }, { href: '/notifications', title: 'Notifikasi', description: 'Status order dan alert', icon: Bell }].map((item) => { const Icon = item.icon; return <Link key={item.href} href={item.href} className="group flex items-center gap-4 rounded-2xl border border-white/10 bg-[#141413] p-5 hover:border-war-gold/40"><Icon className="text-war-gold" /><div className="flex-1"><h2 className="font-display text-xl">{item.title}</h2><p className="text-xs text-muted-foreground">{item.description}</p></div><ArrowRight /></Link> })}</section>
    <Button asChild variant="outline"><Link href="/concerts">Jelajahi konser <ArrowRight /></Link></Button>
  </main>
}
