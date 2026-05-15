'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Menu, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetClose,
} from '@/components/ui/sheet'

export function Navbar() {
  return (
    <nav className="sticky top-0 z-50 border-b border-zinc-800/50 bg-zinc-950/95 backdrop-blur supports-backdrop-filter:bg-zinc-950/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2" aria-label="WAR TICKET - Beranda">
            <div className="text-2xl font-black tracking-tighter text-amber-400">WAR TICKET</div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center gap-8">
            <Link href="/concerts" className="text-sm font-medium text-zinc-300 hover:text-amber-400 transition-colors" aria-label="Buka halaman daftar konser">
              Konser
            </Link>
            <Link href="/my-tickets" className="text-sm font-medium text-zinc-300 hover:text-amber-400 transition-colors" aria-label="Buka halaman tiket saya">
              Tiket Saya
            </Link>
          </div>

          {/* Right section - Desktop */}
          <div className="hidden lg:flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="pulse-dot">
                <div className="h-2 w-2 rounded-full bg-amber-400"></div>
              </div>
              <span className="text-xs font-mono font-semibold text-amber-400">LIVE</span>
            </div>
            <Button
              variant="outline"
              className="border-amber-400/50 text-amber-400 hover:bg-amber-400/10"
              aria-label="Buka halaman masuk"
            >
              Masuk
            </Button>
          </div>

          {/* Mobile menu */}
          <div className="lg:hidden flex items-center gap-4">
            <div className="flex items-center gap-1">
              <div className="pulse-dot">
                <div className="h-1.5 w-1.5 rounded-full bg-amber-400"></div>
              </div>
              <span className="text-xs font-mono font-semibold text-amber-400">LIVE</span>
            </div>
            <Sheet>
              <SheetTrigger asChild>
                <button
                  className="text-zinc-300 hover:text-amber-400 transition-colors"
                  aria-label="Buka menu navigasi"
                >
                  <Menu size={24} />
                </button>
              </SheetTrigger>
              <SheetContent side="right" className="bg-zinc-900 border-zinc-800">
                <div className="space-y-4 mt-8">
                  <SheetClose asChild>
                    <Link
                      href="/concerts"
                      className="block text-base font-medium text-zinc-300 hover:text-amber-400 transition-colors"
                      aria-label="Buka halaman daftar konser"
                    >
                      Konser
                    </Link>
                  </SheetClose>
                  <SheetClose asChild>
                    <Link
                      href="/my-tickets"
                      className="block text-base font-medium text-zinc-300 hover:text-amber-400 transition-colors"
                      aria-label="Buka halaman tiket saya"
                    >
                      Tiket Saya
                    </Link>
                  </SheetClose>
                  <SheetClose asChild>
                    <Button
                      variant="outline"
                      className="w-full border-amber-400/50 text-amber-400 hover:bg-amber-400/10"
                      aria-label="Buka halaman masuk"
                    >
                      Masuk
                    </Button>
                  </SheetClose>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </nav>
  )
}
