'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { ArrowRight, ShieldCheck, Sparkles, Zap } from 'lucide-react'

const item = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 90, damping: 16 } },
}

export function HeroContent() {
  return (
    <motion.div initial="hidden" animate="visible" transition={{ staggerChildren: 0.12 }} className="relative z-10 mx-auto max-w-5xl text-center">
      <motion.div variants={item} className="mb-7 flex justify-center">
        <span className="inline-flex items-center gap-2 rounded-full border border-war-gold/25 bg-war-gold/8 px-4 py-2 text-xs font-bold tracking-wide text-war-gold-bright backdrop-blur-xl"><Sparkles className="size-4" /> Tiket resmi. Stok aktual. Antrean adil.</span>
      </motion.div>
      <motion.h1 variants={item} className="font-display text-6xl leading-[0.88] tracking-wide text-foreground min-[390px]:text-7xl sm:text-8xl lg:text-[7.5rem]">
        Jangan lewatkan<br /><span className="text-war-gold">momenmu.</span>
      </motion.h1>
      <motion.p variants={item} className="mx-auto mt-7 max-w-2xl text-sm leading-7 text-muted-foreground sm:text-lg">Temukan konser terbaik, masuk antrean secara fair, dan amankan tiket tanpa kehilangan kendali di tengah traffic tinggi.</motion.p>
      <motion.div variants={item} className="mt-9 flex flex-col justify-center gap-3 sm:flex-row">
        <Link href="/concerts" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-primary px-7 font-bold text-primary-foreground transition hover:bg-war-gold-bright"><Zap className="size-4" /> Jelajahi konser <ArrowRight className="size-4" /></Link>
        <Link href="/my-tickets" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-7 font-bold transition hover:border-war-gold/35 hover:bg-white/8"><ShieldCheck className="size-4 text-status-success" /> Cek tiket saya</Link>
      </motion.div>
      <motion.dl variants={item} className="mx-auto mt-12 grid max-w-3xl grid-cols-1 gap-3 text-left sm:grid-cols-3">
        {[['01', 'Login sebelum antrean'], ['02', 'Reservasi server-side'], ['03', 'Pembayaran terenkripsi']].map(([number, label]) => (
          <div key={number} className="rounded-xl border border-white/8 bg-black/20 p-4 backdrop-blur-sm"><dt className="font-mono text-xs text-war-gold">{number}</dt><dd className="mt-2 text-xs font-semibold text-foreground">{label}</dd></div>
        ))}
      </motion.dl>
    </motion.div>
  )
}
