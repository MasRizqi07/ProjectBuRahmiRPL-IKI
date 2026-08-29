'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  ArrowRight,
  Bell,
  Check,
  Flame,
  Info,
  Ticket,
} from 'lucide-react'
import { Button } from '@/components/ui/button'

interface NotificationItem {
  id: string
  category: 'war' | 'order' | 'system' | 'promo'
  title: string
  description: string
  timeAgo: string
  read: boolean
  actionHref?: string
  actionLabel?: string
}

type NotificationFilter = 'all' | 'unread' | 'war' | 'system'

const notificationFilters: ReadonlyArray<{ key: NotificationFilter; label: string }> = [
  { key: 'all', label: 'Semua Notifikasi' },
  { key: 'unread', label: 'Belum Dibaca' },
  { key: 'war', label: 'War & Flash Alerts 🔥' },
  { key: 'system', label: 'Transaksi & Sistem' },
]

const initialNotifications: NotificationItem[] = [
  {
    id: 'notif-1',
    category: 'war',
    title: 'SINYAL WAR TIKET: BLACKPINK WORLD TOUR',
    description: 'Antrean tiket dibuka dalam 30 menit! Pastikan saldo dan koneksi internet Anda siap.',
    timeAgo: '2 menit yang lalu',
    read: false,
    actionHref: '/waiting-room?title=BLACKPINK+Live+Show',
    actionLabel: 'Masuk Waiting Room',
  },
  {
    id: 'notif-2',
    category: 'order',
    title: 'Pembayaran Tiket Berhasil Dikonfirmasi',
    description: 'Order #WT-2026-X8910 telah diverifikasi. 2x Tiket VIP Coldplay Live Jakarta kini siap diakses.',
    timeAgo: '2 jam yang lalu',
    read: false,
    actionHref: '/my-tickets',
    actionLabel: 'Buka E-Ticket',
  },
  {
    id: 'notif-3',
    category: 'promo',
    title: 'Diskon Kemitraan Bank BCA 20%',
    description: 'Gunakan kode promo BCAPRESALE untuk potongan hingga Rp 500.000 pada tiket festival pilihan.',
    timeAgo: 'Kemarin',
    read: true,
    actionHref: '/promos',
    actionLabel: 'Lihat Promo',
  },
  {
    id: 'notif-4',
    category: 'system',
    title: 'Upgrade Engine Antrean Selesai',
    description: 'Infrastruktur cloud telah ditingkatkan ke kapasitas 50.000 TPS untuk menjamin kelancaran war tiket.',
    timeAgo: '2 hari yang lalu',
    read: true,
  },
]

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<NotificationItem[]>(initialNotifications)
  const [filter, setFilter] = useState<NotificationFilter>('all')

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
  }

  const filtered = notifications.filter((item) => {
    if (filter === 'unread') return !item.read
    if (filter === 'war') return item.category === 'war'
    if (filter === 'system') return item.category === 'system' || item.category === 'order'
    return true
  })

  return (
    <main className="container-shell py-8 sm:py-12 max-w-4xl space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4 border-b border-white/10 pb-6">
        <div>
          <span className="section-label">PUSAT NOTIFIKASI</span>
          <h1 className="mt-2 font-display text-4xl sm:text-5xl tracking-wide text-foreground">
            ALERTS & UPDATES
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-muted-foreground">
            Sinyal langsung dari server mengenai jadwal war tiket, perubahan kuota, dan status order.
          </p>
        </div>

        <Button
          onClick={markAllAsRead}
          variant="outline"
          className="rounded-xl border-white/15 bg-white/5 text-xs font-bold hover:border-war-gold/40 hover:bg-white/10"
        >
          <Check className="size-3.5 mr-1.5" /> Tandai Semua Dibaca
        </Button>
      </div>

      {/* Filter Chips */}
      <div className="flex flex-wrap gap-2">
        {notificationFilters.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key)}
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

      {/* Notification Cards List */}
      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-white/10 p-12 text-center">
            <Bell className="size-10 mx-auto text-muted-foreground/50 mb-3" />
            <p className="text-sm font-semibold text-muted-foreground">Tidak ada notifikasi dalam filter ini.</p>
          </div>
        ) : (
          filtered.map((item) => {
            const isWar = item.category === 'war'
            const isOrder = item.category === 'order'

            return (
              <div
                key={item.id}
                className={`relative rounded-2xl border p-5 transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${
                  !item.read
                    ? 'border-war-gold/40 bg-[#191815] shadow-[0_0_20px_rgba(240,180,41,0.08)]'
                    : 'border-white/8 bg-[#141413] hover:border-white/20'
                }`}
              >
                {/* Left unread bar */}
                {!item.read && (
                  <div className="absolute left-0 top-3 bottom-3 w-1.5 rounded-r bg-war-gold shadow-[0_0_10px_#f0b429]" />
                )}

                <div className="flex items-start gap-4 pl-2">
                  <div
                    className={`flex size-11 shrink-0 items-center justify-center rounded-xl border ${
                      isWar
                        ? 'border-orange-500/30 bg-orange-500/10 text-orange-400'
                        : isOrder
                        ? 'border-status-success/30 bg-status-success/10 text-status-success'
                        : 'border-blue-500/30 bg-blue-500/10 text-blue-400'
                    }`}
                  >
                    {isWar ? <Flame className="size-5" /> : isOrder ? <Ticket className="size-5" /> : <Info className="size-5" />}
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-display text-xl tracking-wide text-foreground">
                        {item.title}
                      </h4>
                      {!item.read && (
                        <span className="rounded-full bg-urgent-red px-2 py-0.2 text-[9px] font-black text-white">
                          BARU
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                      {item.description}
                    </p>
                    <span className="mt-2 block text-[10px] text-muted-foreground/70 font-mono">
                      {item.timeAgo}
                    </span>
                  </div>
                </div>

                {/* Direct Action button */}
                {item.actionHref && (
                  <Button asChild size="sm" className="sm:self-center shrink-0 rounded-xl bg-primary font-bold text-primary-foreground hover:bg-war-gold-bright text-xs">
                    <Link href={item.actionHref}>
                      {item.actionLabel} <ArrowRight className="size-3.5 ml-1" />
                    </Link>
                  </Button>
                )}
              </div>
            )
          })
        )}
      </div>
    </main>
  )
}
