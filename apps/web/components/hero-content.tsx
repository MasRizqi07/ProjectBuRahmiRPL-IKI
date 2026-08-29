'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  ArrowRight,
  Search,
  Sparkles,
  Zap,
} from 'lucide-react'
import { Button } from '@/components/ui/button'

const quickCategories = [
  'Semua',
  'Jakarta',
  'Bandung',
  'Bali',
  'EDM Festival',
  'K-Pop',
  'Rock Legendaris',
  'Indie Acoustic',
]

export function HeroContent() {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState('')

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      router.push(`/concerts?q=${encodeURIComponent(searchQuery)}`)
    } else {
      router.push('/concerts')
    }
  }

  return (
    <div className="relative z-10 mx-auto max-w-5xl text-center">
      {/* Live Badge */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-6 flex justify-center"
      >
        <span className="inline-flex items-center gap-2 rounded-full border border-war-gold/30 bg-war-gold/10 px-4 py-1.5 text-xs font-bold text-war-gold-bright backdrop-blur-2xl shadow-[0_0_20px_rgba(240,180,41,0.2)]">
          <span className="pulse-dot size-2 rounded-full bg-war-gold" />
          <span>GA + ASSIGNED SEATING • ANTREAN PER SESI</span>
        </span>
      </motion.div>

      {/* Main Display Headline */}
      <motion.h1
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, delay: 0.1 }}
        className="font-display text-6xl leading-[0.88] tracking-wide text-foreground sm:text-8xl lg:text-[7.2rem]"
      >
        JANGAN LEWATKAN <br />
        <span className="text-transparent bg-clip-text bg-linear-to-r from-war-gold via-war-gold-bright to-amber-200 drop-shadow-[0_0_35px_rgba(240,180,41,0.4)]">
          MOMEN EMASMU
        </span>
      </motion.h1>

      <motion.p
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        className="mx-auto mt-6 max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-lg"
      >
        Temukan konser, masuk antrean penjualan yang adil, lalu amankan tiket melalui reservasi server-side yang dibatasi waktu.
      </motion.p>

      {/* Live Search Bar */}
      <motion.form
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.3 }}
        onSubmit={handleSearch}
        className="mx-auto mt-8 flex max-w-2xl items-center rounded-2xl border border-white/15 bg-white/5 p-2 backdrop-blur-2xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] focus-within:border-war-gold focus-within:ring-1 focus-within:ring-war-gold/50"
      >
        <div className="flex items-center pl-3 text-muted-foreground">
          <Search className="size-5 text-war-gold" />
        </div>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Cari artis, festival, atau lokasi venue (cth. Coldplay, GBK, DWP)..."
          className="flex-1 bg-transparent px-3 py-2 text-xs sm:text-sm text-foreground placeholder:text-muted-foreground focus:outline-hidden"
        />
        <Button
          type="submit"
          className="rounded-xl bg-primary px-5 py-5 text-xs font-bold text-primary-foreground transition hover:bg-war-gold-bright"
        >
          <span>Cari Tiket</span>
          <ArrowRight className="size-4 ml-1" />
        </Button>
      </motion.form>

      {/* Quick Category Chips */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.4 }}
        className="mx-auto mt-4 flex max-w-3xl flex-wrap items-center justify-center gap-2"
      >
        <span className="text-[11px] font-semibold text-muted-foreground">Paling Dicari:</span>
        {quickCategories.map((cat) => (
          <Link
            key={cat}
            href={`/concerts?q=${encodeURIComponent(cat === 'Semua' ? '' : cat)}`}
            className="rounded-full border border-white/8 bg-white/3 px-3 py-1 text-[11px] font-medium text-muted-foreground hover:border-war-gold/40 hover:bg-white/8 hover:text-foreground transition"
          >
            {cat}
          </Link>
        ))}
      </motion.div>

      {/* CTAs */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.5 }}
        className="mt-10 flex flex-col justify-center gap-3 sm:flex-row"
      >
        <Link
          href="/concerts"
          className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-primary px-8 font-bold text-primary-foreground transition hover:bg-war-gold-bright active:scale-95 shadow-[0_0_25px_rgba(240,180,41,0.25)]"
        >
          <Zap className="size-4" /> Jelajahi Konser <ArrowRight className="size-4" />
        </Link>
        <Link
          href="/elite"
          className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/5 px-8 font-bold text-foreground transition hover:border-war-gold/40 hover:bg-white/10"
        >
          <Sparkles className="size-4 text-war-gold" /> War Ticket Elite VIP
        </Link>
      </motion.div>
    </div>
  )
}
