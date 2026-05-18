import { Navbar } from '@/components/navbar'
import { InteractiveGrid } from '@/components/interactive-grid'
import { HeroContent } from '@/components/hero-content'
import { StatCard } from '@/components/stat-card'
import { ConcertGrid } from '@/components/concert-grid'
import { concerts } from '@/lib/concerts'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'

export default function Home() {
  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col">
      <Navbar />
      
      {/* Hero Section */}
      <section className="relative flex-1 flex flex-col items-center justify-center px-4 sm:px-6 lg:px-8 pt-32 pb-32 sm:pt-48 sm:pb-40 overflow-hidden min-h-screen">
        {/* Interactive Grid Background */}
        <InteractiveGrid />

        {/* Premium Radial Gradient Mesh */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-amber-500/15 via-zinc-950/80 to-zinc-950 pointer-events-none" />

        {/* Hero Animated Content */}
        <HeroContent />
      </section>

      {/* Floating Stats Bar */}
      <section className="relative z-20 mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8 -mt-32 sm:-mt-24 mb-16 sm:mb-32">
        {/* Layout: 1 col (mobile), 2 cols top + 1 col wide (tablet), 3 cols (desktop) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          <div className="h-40 sm:h-48">
            <StatCard target={47821} label="Tiket Terjual" />
          </div>

          <div className="h-40 sm:h-48">
            <StatCard target={230} suffix="+" label="Konser Tersedia" />
          </div>

          <div className="sm:col-span-2 lg:col-span-1 h-40 sm:h-48">
            <StatCard target={99.9} isDecimal suffix="%" label="Ketersediaan Sistem" />
          </div>
        </div>
      </section>

      {/* Featured Concerts Section */}
      <section className="relative z-20 mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 mb-32">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 sm:mb-12 gap-4">
          <div className="animate-fade-up">
            <h2 className="text-3xl sm:text-5xl font-black text-foreground mb-3 tracking-tight">
              Sedang <span className="bg-gradient-to-r from-amber-400 to-orange-500 bg-clip-text text-transparent">Hangat</span>
            </h2>
            <p className="text-zinc-400 text-sm sm:text-base">
              Deretan konser paling dicari yang tidak boleh kamu lewatkan.
            </p>
          </div>
          <Link 
            href="/concerts" 
            className="hidden sm:flex items-center gap-2 text-amber-400 hover:text-amber-300 font-semibold transition-colors group"
          >
            Lihat Semua Konser <ArrowRight size={18} className="group-hover:translate-x-1.5 transition-transform" />
          </Link>
        </div>
        
        <ConcertGrid concerts={concerts.slice(0, 3)} />

        {/* Mobile View All Button */}
        <div className="mt-8 sm:hidden">
          <Link href="/concerts" className="flex items-center justify-center gap-2 w-full bg-zinc-900 border border-zinc-800 hover:bg-amber-400 hover:text-zinc-950 py-4 rounded-full text-amber-400 font-bold transition-all duration-300">
            Jelajahi Semua <ArrowRight size={18} />
          </Link>
        </div>
      </section>
    </div>
  )
}
