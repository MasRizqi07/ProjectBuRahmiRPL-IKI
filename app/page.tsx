import { Button } from '@/components/ui/button'
import { Navbar } from '@/components/navbar'
import Link from 'next/link'

export default function Home() {
  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col">
      <Navbar />
      
      {/* Hero Section */}
      <section className="relative flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8 py-20 overflow-hidden">
        {/* Grid background */}
        <div className="absolute inset-0 grid-pattern" />

        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-linear-to-b from-amber-500/5 via-transparent to-zinc-950" />

        {/* Content */}
        <div className="relative z-10 max-w-4xl mx-auto text-center space-y-6 animate-fade-up">
          {/* Headline */}
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black tracking-tight text-foreground leading-tight">
            Jangan Lewatkan
            <span className="block text-amber-400">Momen Mu</span>
          </h1>

          {/* Subtitle */}
          <p className="text-lg sm:text-xl text-zinc-400 max-w-2xl mx-auto leading-relaxed">
            Platform tiket konser Indonesia paling kompetitif dengan ribuan penawaran terbaik untuk acara impianmu
          </p>

          {/* CTA Button */}
          <div className="pt-4">
            <Link href="/concerts" aria-label="Buka halaman jelajahi konser">
              <Button
                size="lg"
                className="bg-amber-400 hover:bg-amber-500 text-zinc-950 font-bold text-base px-8 py-6 rounded-xl transition-all duration-200 hover:shadow-lg hover:shadow-amber-400/20 group"
                aria-label="Jelajahi konser"
              >
                Jelajahi Konser
                <span className="ml-2 group-hover:translate-x-1 transition-transform" aria-hidden="true">→</span>
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Floating Stats Bar */}
      <section className="relative z-20 mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 -mt-16 mb-20">
        <div className="bg-zinc-900/80 backdrop-blur border border-zinc-800/50 rounded-2xl p-6 sm:p-8">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
            {/* Stat 1 */}
            <div className="text-center">
              <div className="text-2xl sm:text-3xl font-black text-amber-400 font-mono mb-2" aria-label="Tiket terjual">
                47,821
              </div>
              <p className="text-sm text-zinc-400">Tiket Terjual</p>
            </div>

            {/* Stat 2 */}
            <div className="text-center border-l border-r border-zinc-800/50 px-4 sm:px-8">
              <div className="text-2xl sm:text-3xl font-black text-amber-400 font-mono mb-2" aria-label="Konser tersedia">
                230+
              </div>
              <p className="text-sm text-zinc-400">Konser Tersedia</p>
            </div>

            {/* Stat 3 */}
            <div className="text-center">
              <div className="text-2xl sm:text-3xl font-black text-amber-400 font-mono mb-2" aria-label="Uptime">
                99.9%
              </div>
              <p className="text-sm text-zinc-400">Ketersediaan Sistem</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
