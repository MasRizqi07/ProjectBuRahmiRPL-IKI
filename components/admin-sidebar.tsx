'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { BarChart3, Music, TrendingUp, Settings } from 'lucide-react'

export function AdminSidebar() {
  const pathname = usePathname()

  const navItems = [
    { href: '/admin', label: 'Overview', icon: BarChart3 },
    { href: '/admin/concerts', label: 'Konser', icon: Music },
    { href: '/admin/sales', label: 'Penjualan', icon: TrendingUp },
    { href: '/admin/settings', label: 'Pengaturan', icon: Settings },
  ]

  return (
    <aside className="w-64 bg-zinc-900 border-r border-zinc-800 h-screen sticky top-0 flex flex-col">
      {/* Logo */}
      <div className="p-6 border-b border-zinc-800">
        <h1 className="font-display text-xl font-black text-amber-400">WAR TICKET</h1>
        <p className="text-xs text-zinc-500 mt-1">Admin Panel</p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                isActive
                  ? 'bg-amber-400/10 text-amber-400 border border-amber-400/30'
                  : 'text-zinc-400 hover:bg-zinc-800 border border-transparent'
              }`}
            >
              <Icon size={20} />
              <span className="font-medium">{item.label}</span>
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-zinc-800">
        <div className="px-4 py-3 bg-zinc-800/50 rounded-lg">
          <p className="text-xs text-zinc-500 mb-1">Logged in as</p>
          <p className="text-sm font-semibold text-foreground">Admin User</p>
        </div>
      </div>
    </aside>
  )
}
