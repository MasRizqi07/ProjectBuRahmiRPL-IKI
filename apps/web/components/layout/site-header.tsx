'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Bell,
  ChevronDown,
  Crown,
  LayoutDashboard,
  Menu,
  Radio,
  Scan,
  ShieldCheck,
  Ticket,
  User,
  Zap,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Sheet, SheetClose, SheetContent, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { cn } from '@/lib/utils'
import { logout } from '@/app/actions/auth'
import type { Viewer } from '@/lib/auth/authorization'

const mainNavigation = [
  { href: '/concerts', label: 'Jelajahi' },
  { href: '/promos', label: 'Promo & Deals', badge: 'HOT' },
  { href: '/elite', label: 'Elite VIP', icon: Crown },
  { href: '/community', label: 'Frontline Live' },
  { href: '/help', label: 'Bantuan' },
] as const

export function SiteHeader({ viewer }: { readonly viewer: Viewer | null }) {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const [portalDropdownOpen, setPortalDropdownOpen] = useState(false)

  return (
    <header className="sticky top-0 z-50 border-b border-white/8 bg-background/85 backdrop-blur-2xl">
      <div className="container-shell flex h-(--header-height) items-center justify-between gap-4">
        {/* Brand */}
        <Link href="/" className="group flex items-center gap-2.5 shrink-0" aria-label="WAR TICKET — Beranda">
          <div className="flex size-9 items-center justify-center rounded-xl border border-war-gold/40 bg-linear-to-br from-war-gold/20 to-black p-1 shadow-[0_0_15px_rgba(240,180,41,0.25)]">
            <span className="font-display text-lg font-black text-war-gold leading-none">WT</span>
          </div>
          <div className="flex flex-col">
            <span className="font-display text-2xl leading-none tracking-wide text-foreground transition group-hover:text-war-gold">
              WAR TICKET
            </span>
            <span className="text-[9px] font-bold tracking-[0.2em] text-war-gold-bright uppercase leading-tight">
              CYBER TICKETING
            </span>
          </div>
        </Link>

        {/* Desktop Main Navigation */}
        <nav className="hidden items-center gap-6 xl:gap-8 md:flex" aria-label="Navigasi utama">
          {mainNavigation.map((item) => {
            const active = pathname === item.href || pathname.startsWith(`${item.href}/`)
            const Icon = 'icon' in item ? item.icon : null

            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'relative flex items-center gap-1.5 py-2 text-xs xl:text-sm font-semibold transition-colors',
                  active
                    ? 'text-war-gold-bright font-bold after:absolute after:inset-x-0 after:-bottom-1 after:h-0.5 after:bg-war-gold after:shadow-[0_0_8px_#f0b429]'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                {Icon && <Icon className="size-3.5 text-war-gold" />}
                {item.label}
                {'badge' in item && item.badge && (
                  <span className="rounded-full bg-red-700 px-1.5 py-0.2 text-[9px] font-black text-white">
                    {item.badge}
                  </span>
                )}
              </Link>
            )
          })}
        </nav>

        {/* Actions & Portals Switcher */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Live Status indicator */}
          <Link
            href="/community"
            className="hidden items-center gap-2 rounded-full border border-status-success/25 bg-status-success/10 px-3 py-1 text-[11px] font-bold tracking-wider text-status-success lg:flex hover:bg-status-success/20 transition"
          >
            <span className="pulse-dot size-1.5 rounded-full bg-status-success" />
            <span>WAR ROOM LIVE</span>
          </Link>

          {/* Notifications Button */}
          <Button asChild variant="ghost" size="icon" className="relative rounded-full text-muted-foreground hover:text-foreground">
            <Link href="/notifications" aria-label="Notifikasi">
              <Bell className="size-4" />
              <span className="absolute top-2 right-2 size-2 rounded-full bg-war-gold animate-pulse" />
            </Link>
          </Button>

          {/* Portal Switcher Dropdown (Desktop) */}
          <div className="relative hidden md:block">
            <button
              onClick={() => setPortalDropdownOpen(!portalDropdownOpen)}
              onBlur={() => setTimeout(() => setPortalDropdownOpen(false), 200)}
              className="flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold text-muted-foreground hover:border-war-gold/40 hover:text-foreground transition"
            >
              <LayoutDashboard className="size-3.5 text-war-gold" />
              <span>Portal</span>
              <ChevronDown className="size-3" />
            </button>

            {portalDropdownOpen && (
              <div className="absolute right-0 top-full mt-2 w-56 rounded-2xl border border-white/10 bg-[#121211]/95 p-2 shadow-[0_20px_40px_rgba(0,0,0,0.7)] backdrop-blur-2xl z-50 animate-fade-up">
                <div className="px-3 py-1.5 text-[10px] font-black tracking-widest text-muted-foreground uppercase">
                  PILIH PORTAL
                </div>
                <Link
                  href="/dashboard"
                  className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-medium text-foreground hover:bg-white/8 transition"
                >
                  <User className="size-4 text-blue-400" />
                  <div>
                    <p className="font-semibold">User Dashboard</p>
                    <p className="text-[10px] text-muted-foreground">Profil & Tiket Saya</p>
                  </div>
                </Link>
                <Link
                  href="/organizer"
                  className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-medium text-foreground hover:bg-white/8 transition"
                >
                  <Zap className="size-4 text-war-gold" />
                  <div>
                    <p className="font-semibold">Promoter Hub</p>
                    <p className="text-[10px] text-muted-foreground">Command & Kuota Event</p>
                  </div>
                </Link>
                <Link
                  href="/scanner"
                  className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-medium text-foreground hover:bg-white/8 transition"
                >
                  <Scan className="size-4 text-emerald-400" />
                  <div>
                    <p className="font-semibold">Gate Scanner</p>
                    <p className="text-[10px] text-muted-foreground">Validasi QR di Pintu Masuk</p>
                  </div>
                </Link>
                <Link
                  href="/admin"
                  className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-medium text-foreground hover:bg-white/8 transition"
                >
                  <ShieldCheck className="size-4 text-purple-400" />
                  <div>
                    <p className="font-semibold">Super Admin</p>
                    <p className="text-[10px] text-muted-foreground">Security & Global Telemetry</p>
                  </div>
                </Link>
              </div>
            )}
          </div>

          {/* User Account / Login Button */}
          {viewer ? (
            <form action={logout} className="hidden md:block">
              <Button type="submit" variant="outline" className="rounded-full px-4 text-xs" title={`Keluar dari ${viewer.email ?? 'akun'}`}>
                {viewer.name?.split(' ')[0] ?? 'Keluar'} · Keluar
              </Button>
            </form>
          ) : (
            <Button asChild className="hidden rounded-full px-5 text-xs font-bold md:inline-flex bg-primary text-primary-foreground hover:bg-war-gold-bright">
              <Link href="/login">Masuk</Link>
            </Button>
          )}

          {/* Mobile Sheet Menu */}
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon" className="rounded-full md:hidden border-white/10" aria-label="Buka menu">
                <Menu className="size-4" />
              </Button>
            </SheetTrigger>
            <SheetContent className="border-border bg-background/98 px-6 backdrop-blur-2xl overflow-y-auto" side="right">
              <SheetTitle className="font-display text-3xl tracking-wide text-war-gold">
                WAR TICKET
              </SheetTitle>
              <p className="text-xs text-muted-foreground mt-0.5">High-Stakes Ticketing Platform</p>

              <div className="mt-8 flex flex-col gap-2">
                <p className="text-[10px] font-black uppercase tracking-wider text-muted-foreground px-2">Menu Utama</p>
                {mainNavigation.map((item) => (
                  <SheetClose asChild key={item.href}>
                    <Link
                      href={item.href}
                      className={cn(
                        'flex items-center justify-between rounded-xl px-4 py-3 text-sm font-semibold transition',
                        pathname === item.href ? 'bg-war-gold/15 text-war-gold-bright border border-war-gold/30' : 'hover:bg-white/6'
                      )}
                    >
                      <span>{item.label}</span>
                      {'badge' in item && (
                        <span className="rounded-full bg-red-700 px-2 py-0.5 text-[10px] font-black text-white">
                          {item.badge}
                        </span>
                      )}
                    </Link>
                  </SheetClose>
                ))}

                <p className="mt-6 text-[10px] font-black uppercase tracking-wider text-muted-foreground px-2">Pusat Akses & Portal</p>
                <SheetClose asChild>
                  <Link href="/my-tickets" className="flex items-center gap-3 rounded-xl px-4 py-2.5 text-xs font-semibold hover:bg-white/6">
                    <Ticket className="size-4 text-war-gold" /> Tiket Saya
                  </Link>
                </SheetClose>
                <SheetClose asChild>
                  <Link href="/dashboard" className="flex items-center gap-3 rounded-xl px-4 py-2.5 text-xs font-semibold hover:bg-white/6">
                    <User className="size-4 text-blue-400" /> User Dashboard
                  </Link>
                </SheetClose>
                <SheetClose asChild>
                  <Link href="/organizer" className="flex items-center gap-3 rounded-xl px-4 py-2.5 text-xs font-semibold hover:bg-white/6">
                    <Zap className="size-4 text-war-gold" /> Promoter Hub
                  </Link>
                </SheetClose>
                <SheetClose asChild>
                  <Link href="/scanner" className="flex items-center gap-3 rounded-xl px-4 py-2.5 text-xs font-semibold hover:bg-white/6">
                    <Scan className="size-4 text-emerald-400" /> Gate Scanner
                  </Link>
                </SheetClose>
                <SheetClose asChild>
                  <Link href="/admin" className="flex items-center gap-3 rounded-xl px-4 py-2.5 text-xs font-semibold hover:bg-white/6">
                    <ShieldCheck className="size-4 text-purple-400" /> Super Admin
                  </Link>
                </SheetClose>

                <div className="mt-6 pt-4 border-t border-white/10">
                  {viewer ? (
                    <form action={logout}>
                      <button type="submit" className="flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 px-4 py-3 text-sm font-bold">
                        <Radio className="size-4" /> Keluar dari Akun
                      </button>
                    </form>
                  ) : (
                    <SheetClose asChild>
                      <Link href="/login" className="flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-bold text-primary-foreground">
                        <Radio className="size-4" /> Masuk ke Akun
                      </Link>
                    </SheetClose>
                  )}
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  )
}
