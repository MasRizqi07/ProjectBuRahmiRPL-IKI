'use client'

import { motion, useMotionValue, useTransform, animate, useInView } from 'framer-motion'
import { useEffect, useRef } from 'react'

export function StatCard({ target, label, suffix = "", isDecimal = false }: { target: number, label: string, suffix?: string, isDecimal?: boolean }) {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: "-50px" })
  const count = useMotionValue(0)
  
  const rounded = useTransform(count, (latest) => {
    if (isDecimal) {
      return latest.toFixed(1) + suffix
    }
    return Math.round(latest).toLocaleString('en-US') + suffix
  })

  useEffect(() => {
    if (inView) {
      const animation = animate(count, target, { duration: 2, ease: "easeOut" })
      return () => animation.stop()
    }
    return () => {}
  }, [inView, count, target])

  return (
    <motion.div
      ref={ref}
      whileHover={{ y: -5, boxShadow: "0px 10px 30px rgba(251, 191, 36, 0.1)" }}
      className="p-6 sm:p-8 bg-zinc-900 border border-zinc-800 rounded-2xl transition-all relative overflow-hidden group h-full flex flex-col justify-center"
    >
      <div className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-transparent via-amber-400 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 shadow-[0_0_10px_rgba(251,191,36,0.5)]"></div>
      <motion.h3 className="text-4xl sm:text-5xl font-black text-amber-400 font-mono mb-2 text-center">
        {rounded}
      </motion.h3>
      <p className="text-sm sm:text-base text-zinc-400 font-medium text-center">{label}</p>
    </motion.div>
  )
}
