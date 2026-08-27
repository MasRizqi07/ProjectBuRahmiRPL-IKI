'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Menu, Radio, ShoppingBag } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Sheet, SheetClose, SheetContent, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { cn } from '@/lib/utils'

const navigation = [
  { href: '/concerts', label: 'Jelajahi' },
  { href: '/my-tickets', label: 'Tiket Saya' },
] as const

export function SiteHeader() {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)

  return (
    <header className="sticky top-0 z-50 border-b border-white/8 bg-background/82 backdrop-blur-2xl">
      <div className="container-shell flex h-(--header-height) items-center justify-between gap-4">
        <Link href="/" className="group shrink-0" aria-label="WAR TICKET — Beranda">
          <span className="font-display text-3xl leading-none tracking-wide text-war-gold transition group-hover:text-war-gold-bright">WAR TICKET</span>
        </Link>

        <nav className="hidden items-center gap-8 md:flex" aria-label="Navigasi utama">
          {navigation.map((item) => {
            const active = pathname === item.href || pathname.startsWith(`${item.href}/`)
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? 'page' : undefined}
                className={cn('relative py-2 text-sm font-semibold text-muted-foreground transition-colors hover:text-foreground', active && 'text-foreground after:absolute after:inset-x-0 after:-bottom-1 after:h-0.5 after:bg-war-gold')}
              >
                {item.label}
              </Link>
            )
          })}
        </nav>

        <div className="flex items-center gap-2 sm:gap-3">
          <div className="hidden items-center gap-2 rounded-full border border-status-success/20 bg-status-success/8 px-3 py-1.5 text-[11px] font-bold tracking-widest text-status-success min-[390px]:flex">
            <span className="pulse-dot size-1.5 rounded-full bg-status-success" /> LIVE
          </div>
          <Button asChild variant="ghost" size="icon" className="hidden rounded-full sm:inline-flex">
            <Link href="/concerts" aria-label="Cari tiket konser"><ShoppingBag /></Link>
          </Button>
          <Button asChild className="hidden rounded-full px-5 font-bold md:inline-flex">
            <Link href="/login">Masuk</Link>
          </Button>

          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon" className="rounded-full md:hidden" aria-label="Buka menu"><Menu /></Button>
            </SheetTrigger>
            <SheetContent className="border-border bg-background/96 px-6 backdrop-blur-2xl" side="right">
              <SheetTitle className="font-display text-3xl tracking-wide text-war-gold">WAR TICKET</SheetTitle>
              <div className="mt-10 flex flex-col gap-2">
                {navigation.map((item) => (
                  <SheetClose asChild key={item.href}>
                    <Link href={item.href} className="rounded-xl px-4 py-3 text-base font-semibold hover:bg-white/6">{item.label}</Link>
                  </SheetClose>
                ))}
                <SheetClose asChild>
                  <Link href="/login" className="mt-4 flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 font-bold text-primary-foreground"><Radio className="size-4" /> Masuk ke akun</Link>
                </SheetClose>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  )
}
