import { Navbar } from '@/components/navbar'
import { InteractiveGrid } from '@/components/interactive-grid'
import { HeroContent } from '@/components/hero-content'
import { StatCard } from '@/components/stat-card'

export default function Home() {
  return (
    <div className="min-h-screen bg-[#0A0A0A] flex flex-col">
      <Navbar />
      
      {/* Hero Section */}
      <section className="relative flex-1 flex flex-col items-center justify-center px-4 sm:px-6 lg:px-8 pt-10 pb-32 sm:py-24 overflow-hidden">
        {/* Interactive Grid Background */}
        <InteractiveGrid />

        {/* Gradient overlay for blending */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#FFC700]/5 via-transparent to-[#0A0A0A] pointer-events-none" />

        {/* Hero Animated Content */}
        <HeroContent />
      </section>

      {/* Floating Stats Bar */}
      <section className="relative z-20 mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8 -mt-20 mb-24">
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
    </div>
  )
}
