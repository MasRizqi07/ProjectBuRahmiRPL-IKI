'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { ArrowRight, ChevronDown } from 'lucide-react'
import Image from 'next/image'

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.15, delayChildren: 0.3 }
  }
}

const itemVariants = {
  hidden: { opacity: 0, y: 40 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: 'spring' as const, stiffness: 100, damping: 15 }
  }
}

export function HeroContent() {
  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="relative z-10 max-w-5xl mx-auto text-center space-y-8 sm:space-y-10"
    >
      {/* Badge Top */}
      <motion.div variants={itemVariants} className="flex justify-center">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-violet-500/30 bg-violet-500/10 text-violet-400 text-xs sm:text-sm font-semibold tracking-wide backdrop-blur-md">
          🎫 Platform Tiket Konser Indonesia #1
        </div>
      </motion.div>

      {/* Main Headline */}
      <motion.h1 variants={itemVariants} className="font-display text-6xl sm:text-8xl lg:text-9xl font-black tracking-tighter text-white leading-[1.1]">
        Rasakan Energi <br className="hidden sm:block" />
        <span className="bg-clip-text text-transparent bg-gradient-to-r from-violet-500 via-purple-500 to-fuchsia-500">
          Konser Langsung.
        </span>
      </motion.h1>

      {/* Subtitle */}
      <motion.p variants={itemVariants} className="font-body text-lg sm:text-xl lg:text-2xl text-zinc-400 max-w-3xl mx-auto leading-relaxed px-4">
        Platform tiket konser Indonesia paling kompetitif dengan ribuan penawaran terbaik untuk acara impianmu.
      </motion.p>

      {/* CTA Buttons */}
      <motion.div variants={itemVariants} className="pt-4 flex flex-col sm:flex-row justify-center gap-4 px-4">
        <Link href="/concerts" className="w-full sm:w-auto">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="w-full sm:w-auto bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 text-white font-bold text-lg px-10 py-5 rounded-full transition-all duration-300 shadow-lg shadow-violet-500/25 flex items-center justify-center gap-2 border border-violet-400/30"
          >
            Cari Konser
            <ArrowRight size={20} />
          </motion.button>
        </Link>
        <Link href="/concerts" className="w-full sm:w-auto">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="w-full sm:w-auto bg-white/5 hover:bg-white/10 text-white border border-white/10 font-bold text-lg px-10 py-5 rounded-full transition-all duration-300 flex items-center justify-center backdrop-blur-sm"
          >
            Lihat Jadwal
          </motion.button>
        </Link>
      </motion.div>

      {/* Social Proof */}
      <motion.div variants={itemVariants} className="pt-8 flex flex-col items-center gap-3">
        <div className="flex -space-x-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="w-12 h-12 rounded-full border-2 border-zinc-950 bg-gradient-to-br from-violet-400 to-fuchsia-600 flex items-center justify-center overflow-hidden">
               {/* Placeholders for avatars. In a real app these would be images */}
               <div className="w-full h-full bg-white/20" />
            </div>
          ))}
          <div className="w-12 h-12 rounded-full border-2 border-zinc-950 bg-zinc-800 flex items-center justify-center font-mono text-xs font-bold text-white z-10">
            +50K
          </div>
        </div>
        <p className="font-body text-sm text-zinc-500 font-medium">50.000+ fans sudah bergabung</p>
      </motion.div>

      {/* Scroll Indicator */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5, duration: 1 }}
        className="absolute -bottom-24 left-1/2 -translate-x-1/2"
      >
        <motion.div
          animate={{ y: [0, 10, 0] }}
          transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
          className="text-white/30"
        >
          <ChevronDown size={32} />
        </motion.div>
      </motion.div>
    </motion.div>
  )
}
