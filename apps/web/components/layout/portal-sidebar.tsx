'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  ArrowLeft,
  BarChart3,
  CalendarPlus,
  FileSpreadsheet,
  Gauge,
  History,
  LayoutDashboard,
  Scan,
  ShieldAlert,
  UserCheck,
  Wallet,
} from 'lucide-react'
import { cn } from '@/lib/utils'

export interface PortalSidebarProps {
  portalType: 'organizer' | 'admin'
}

export function PortalSidebar({ portalType }: PortalSidebarProps) {
  const pathname = usePathname()

  const organizerNav = [
    {
      title: 'COMMAND & CONTROL',
      items: [
        { href: '/organizer', label: 'Command Center', icon: Gauge },
        { href: '/organizer/events/new', label: 'Buat Event & Kuota', icon: CalendarPlus },
        { href: '/scanner', label: 'Gate QR Scanner', icon: Scan },
      ],
    },
    {
      title: 'ANALYTICS & REPORTS',
      items: [
        { href: '/organizer/seating-analytics', label: 'Seating Analytics', icon: BarChart3 },
        { href: '/organizer/reports', label: 'Laporan Penjualan', icon: FileSpreadsheet },
      ],
    },
    {
      title: 'FINANCIALS',
      items: [
        { href: '/organizer/wallet', label: 'Dompet & Pencairan', icon: Wallet },
      ],
    },
  ]

  const adminNav = [
    {
      title: 'PLATFORM MANAGEMENT',
      items: [
        { href: '/admin', label: 'Master Dashboard', icon: LayoutDashboard },
        { href: '/admin/security', label: 'Security & Anti-Bot', icon: ShieldAlert },
      ],
    },
    {
      title: 'OPERATIONS & COMPLIANCE',
      items: [
        { href: '/admin/disputes', label: 'Support & Sengketa', icon: UserCheck },
        { href: '/admin/audit-logs', label: 'System Audit Logs', icon: History },
      ],
    },
  ]

  const sections = portalType === 'organizer' ? organizerNav : adminNav

  return (
    <aside className="hidden lg:flex w-64 flex-col border-r border-white/10 bg-[#0e0e0d] p-4 text-foreground shrink-0 min-h-[calc(100vh-var(--header-height))]">
      {/* Portal Header */}
      <div className="mb-6 rounded-2xl border border-white/10 bg-white/4 p-4">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-black uppercase tracking-widest text-war-gold">
            {portalType === 'organizer' ? 'ORGANIZER SUITE' : 'SUPER ADMIN'}
          </span>
          <span className="flex items-center gap-1 text-[10px] font-bold text-status-success">
            <span className="pulse-dot size-1.5 rounded-full bg-status-success" /> ONLINE
          </span>
        </div>
        <h2 className="mt-1 font-display text-xl tracking-wide text-foreground">
          {portalType === 'organizer' ? 'Promoter Hub' : 'System Sentinel'}
        </h2>
      </div>

      {/* Nav Menu */}
      <nav className="flex-1 space-y-6 overflow-y-auto">
        {sections.map((section) => (
          <div key={section.title} className="space-y-1.5">
            <p className="px-3 text-[10px] font-bold tracking-wider text-muted-foreground uppercase">
              {section.title}
            </p>
            <div className="space-y-1">
              {section.items.map((item) => {
                const Icon = item.icon
                const isActive = pathname === item.href
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      'flex items-center gap-3 rounded-xl px-3 py-2.5 text-xs font-semibold transition-all',
                      isActive
                        ? 'border border-war-gold/30 bg-war-gold/15 text-war-gold-bright shadow-[0_0_15px_rgba(240,180,41,0.15)]'
                        : 'text-muted-foreground hover:border-white/10 hover:bg-white/5 hover:text-foreground'
                    )}
                  >
                    <Icon className={cn('size-4', isActive ? 'text-war-gold' : 'text-muted-foreground')} />
                    <span>{item.label}</span>
                  </Link>
                )
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Footer Switcher */}
      <div className="mt-auto pt-4 border-t border-white/10 space-y-2">
        <Link
          href="/"
          className="flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold text-muted-foreground hover:bg-white/5 hover:text-foreground transition"
        >
          <ArrowLeft className="size-3.5" /> Kembali ke Web Utama
        </Link>
        <div className="flex items-center justify-between rounded-xl bg-black/40 p-2.5 text-[11px] text-muted-foreground border border-white/5">
          <span>Server Cluster: JKT-01</span>
          <span className="font-mono text-status-success font-bold">12ms</span>
        </div>
      </div>
    </aside>
  )
}
