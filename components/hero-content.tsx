'use client'

import { motion, useMotionValue, useSpring } from 'framer-motion'
import { useRef } from 'react'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'

function MagneticButton({ children, className }: any) {
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
  const words = "Jangan Lewatkan Momen Mu".split(" ")

  return (
    <div className="relative z-10 max-w-4xl mx-auto text-center space-y-6 sm:space-y-8 mt-10">
      {/* Headline with Text Splitting */}
      <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight text-white leading-tight flex flex-wrap justify-center gap-x-3 sm:gap-x-4">
        {words.map((word, i) => (
          <motion.span
            key={i}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: i * 0.2, ease: [0.2, 0.65, 0.3, 0.9] }}
            className={`inline-block ${word === "Mu" || word === "Momen" ? "text-[#FFC700]" : ""}`}
          >
            {word}
          </motion.span>
        ))}
      </h1>

      {/* Subtitle */}
      <motion.p 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1, duration: 0.8 }}
        className="text-base sm:text-lg lg:text-xl text-neutral-400 max-w-2xl mx-auto leading-relaxed px-4"
      >
        Platform tiket konser Indonesia paling kompetitif dengan ribuan penawaran terbaik untuk acara impianmu
      </motion.p>

      {/* CTA Button */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.2, duration: 0.5 }}
        className="pt-6 sm:pt-8 flex justify-center w-full px-4 sm:px-0"
      >
        <Link href="/concerts" aria-label="Buka halaman jelajahi konser" className="w-full sm:w-auto">
          <MagneticButton className="w-full sm:w-auto">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="w-full sm:w-auto bg-[#FFC700] hover:bg-[#E5B300] text-[#0A0A0A] font-black text-lg px-8 py-5 rounded-2xl transition-all duration-300 shadow-[0_0_20px_rgba(255,199,0,0.3)] hover:shadow-[0_0_40px_rgba(255,199,0,0.6)] flex items-center justify-center gap-3 group"
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
