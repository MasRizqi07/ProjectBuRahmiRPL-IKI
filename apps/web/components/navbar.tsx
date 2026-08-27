'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Menu, ShoppingBag } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetClose,
} from '@/components/ui/sheet'

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div className="fixed top-4 inset-x-0 z-50 flex justify-center px-4 pointer-events-none">
      <nav className="pointer-events-auto w-full max-w-5xl rounded-full border border-zinc-700/50 bg-zinc-950/60 backdrop-blur-xl shadow-[0_8px_32px_rgba(0,0,0,0.4)] px-6 sm:px-8 py-3 transition-all duration-300">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2" aria-label="WAR TICKET - Beranda">
            <div className="text-xl sm:text-2xl font-black tracking-tighter bg-linear-to-r from-amber-300 to-amber-500 bg-clip-text text-transparent">WAR TICKET</div>
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
            <Link href="/cart" className="inline-flex items-center text-zinc-300 hover:text-amber-400 transition-transform hover:scale-110" aria-label="Buka keranjang tiket">
              <ShoppingBag size={20} />
            </Link>
            <div className="flex items-center gap-2">
              <div className="pulse-dot">
                <div className="h-2 w-2 rounded-full bg-amber-400"></div>
              </div>
              <span className="text-xs font-mono font-semibold text-amber-400">LIVE</span>
            </div>
            <Button
              variant="outline"
              className="border-amber-400/50 text-amber-400 hover:bg-amber-400 hover:text-zinc-950 rounded-full px-6 font-bold transition-all duration-300"
              aria-label="Buka halaman masuk"
            >
              Masuk
            </Button>
          </div>

          {/* Mobile menu */}
          <div className="lg:hidden flex items-center gap-4">
            <Link href="/cart" className="inline-flex items-center text-zinc-300 hover:text-amber-400 transition-transform hover:scale-110" aria-label="Buka keranjang tiket">
              <ShoppingBag size={18} />
            </Link>
            <div className="flex items-center gap-1">
              <div className="pulse-dot">
                <div className="h-1.5 w-1.5 rounded-full bg-amber-400"></div>
              </div>
              <span className="text-xs font-mono font-semibold text-amber-400">LIVE</span>
            </div>
            <Sheet open={isOpen} onOpenChange={setIsOpen}>
              <SheetTrigger asChild>
                <button
                  className="text-zinc-300 hover:text-amber-400 transition-transform hover:scale-110"
                  aria-label="Buka menu navigasi"
                >
                  <Menu size={24} />
                </button>
              </SheetTrigger>
              <SheetContent side="right" className="bg-zinc-950/90 backdrop-blur-xl border-zinc-800">
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
                      className="w-full border-amber-400 text-amber-400 hover:bg-amber-400 hover:text-zinc-950 rounded-full font-bold transition-all"
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
      </nav>
    </div>
  )
}
