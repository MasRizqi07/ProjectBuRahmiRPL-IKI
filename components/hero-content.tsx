'use client'

import { motion, useMotionValue, useSpring } from 'framer-motion'
import { useRef } from 'react'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'

interface MagneticButtonProps {
  children: React.ReactNode
  className?: string
}

function MagneticButton({ children, className }: MagneticButtonProps) {
  const ref = useRef<HTMLDivElement>(null)
  const x = useMotionValue(0)
  const y = useMotionValue(0)

  const springX = useSpring(x, { stiffness: 150, damping: 15, mass: 0.1 })
  const springY = useSpring(y, { stiffness: 150, damping: 15, mass: 0.1 })

  const handleMouse = (e: React.MouseEvent<HTMLDivElement>) => {
    const { clientX, clientY } = e
    if (!ref.current) return
    const { height, width, left, top } = ref.current.getBoundingClientRect()
    const middleX = clientX - (left + width / 2)
    const middleY = clientY - (top + height / 2)
    x.set(middleX * 0.2) // 20% pull
    y.set(middleY * 0.2)
  }

  const handleMouseLeave = () => {
    x.set(0)
    y.set(0)
  }

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMouse}
      onMouseLeave={handleMouseLeave}
      style={{ x: springX, y: springY }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

export function HeroContent() {
  const titleText = "Jangan Lewatkan Momen Mu"
  const words = titleText.split(" ")

  return (
    <div className="relative z-10 max-w-5xl mx-auto text-center space-y-8 sm:space-y-10 mt-10">
      {/* Badge Top */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="flex justify-center">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-amber-500/30 bg-amber-500/10 text-amber-400 text-xs sm:text-sm font-semibold tracking-wide">
          <span className="relative flex size-2"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span><span className="relative inline-flex rounded-full size-2 bg-amber-500"></span></span> Event Terbesar 2026 Segera Hadir
        </div>
      </motion.div>

      {/* Headline with Text Splitting */}
      {/* aria-label ensures screen readers read it continuously, not word by word */}
      <h1 className="text-5xl sm:text-7xl lg:text-8xl font-black tracking-tighter text-white leading-tight flex flex-wrap justify-center gap-x-3 sm:gap-x-5" aria-label={titleText}>
        {words.map((word, i) => (
          <motion.span
            key={i}
            aria-hidden="true"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: i * 0.2, ease: [0.2, 0.65, 0.3, 0.9] }}
            className={`inline-block ${word === "Mu" || word === "Momen" ? "bg-gradient-to-br from-amber-300 to-amber-600 bg-clip-text text-transparent drop-shadow-[0_0_15px_rgba(251,191,36,0.3)]" : ""}`}
          >
            {word}
          </motion.span>
        ))}
      </h1>

      {/* Subtitle */}
      <motion.p 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8, duration: 0.8 }}
        className="text-base sm:text-lg lg:text-2xl text-zinc-400 max-w-3xl mx-auto leading-relaxed px-4 font-medium"
      >
        Platform tiket konser Indonesia paling kompetitif dengan ribuan penawaran terbaik untuk acara impianmu
      </motion.p>

      {/* CTA Button */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.0, duration: 0.5 }}
        className="pt-4 sm:pt-8 flex justify-center w-full px-4 sm:px-0"
      >
        <Link href="/concerts" aria-label="Buka halaman jelajahi konser" className="w-full sm:w-auto">
          <MagneticButton className="w-full sm:w-auto">
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              className="w-full sm:w-auto bg-gradient-to-r from-amber-400 to-amber-500 text-zinc-950 font-black text-lg px-10 py-5 rounded-full transition-all duration-300 shadow-[0_10px_40px_rgba(251,191,36,0.3)] hover:shadow-[0_10px_60px_rgba(251,191,36,0.5)] flex items-center justify-center gap-3 group border border-amber-300/50"
            >
              Jelajah Konser
              <motion.div
                className="group-hover:translate-x-1.5 transition-transform duration-300"
              >
                <ArrowRight size={24} strokeWidth={3} />
              </motion.div>
            </motion.button>
          </MagneticButton>
        </Link>
      </motion.div>
    </div>
  )
}
