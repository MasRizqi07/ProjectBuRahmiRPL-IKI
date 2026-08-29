import { getPlatformStats } from '@/lib/queries/concerts'
import { Ticket, Calendar, ShieldCheck } from 'lucide-react'

export async function StatsBar() {
  const stats = await getPlatformStats()

  const items = [
    {
      icon: Ticket,
      value: `${stats.ticketsSold.toLocaleString('id-ID')}+`,
      label: 'Tiket Terjual',
      sublabel: 'Transaksi berhasil & terverifikasi',
    },
    {
      icon: Calendar,
      value: `${stats.activeEvents.toLocaleString('id-ID')}`,
      label: 'Event Aktif',
      sublabel: 'Konser & festival siap war',
    },
    {
      icon: ShieldCheck,
      value: '100%',
      label: 'Jaminan Resmi',
      sublabel: 'Kemitraan langsung dengan promotor',
    },
  ]

  return (
    <section className="border-y border-white/8 bg-[#111110]/80 py-8 backdrop-blur-xl">
      <div className="container-shell">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
          {items.map((item, idx) => {
            const Icon = item.icon
            return (
              <div
                key={idx}
                className="glass-panel flex items-center gap-4 rounded-2xl border border-white/10 p-5 shadow-lg transition-transform duration-300 hover:scale-[1.02]"
              >
                <div className="flex size-12 shrink-0 items-center justify-center rounded-xl border border-war-gold/30 bg-war-gold/10 text-war-gold">
                  <Icon className="size-6" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-display text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                    {item.value}
                  </p>
                  <p className="text-xs font-semibold text-war-gold-bright uppercase tracking-wider">
                    {item.label}
                  </p>
                  <p className="mt-0.5 text-[11px] text-muted-foreground truncate">
                    {item.sublabel}
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}

