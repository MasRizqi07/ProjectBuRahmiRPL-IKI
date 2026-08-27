import { LockKeyhole, ShieldCheck, Zap } from 'lucide-react'

interface AuthShellProps {
  readonly eyebrow: string
  readonly title: string
  readonly description: string
  readonly children: React.ReactNode
}

export function AuthShell({ eyebrow, title, description, children }: AuthShellProps) {
  return (
    <main id="main-content" className="container-shell grid flex-1 items-stretch gap-8 py-8 lg:grid-cols-[0.9fr_1.1fr] lg:py-14">
      <aside className="hero-bg relative hidden min-h-[620px] overflow-hidden rounded-3xl border border-white/8 p-10 lg:flex lg:flex-col lg:justify-between">
        <div className="absolute inset-0 grid-pattern opacity-40" />
        <div className="relative">
          <p className="section-label">Akses aman</p>
          <h2 className="mt-7 max-w-lg font-display text-6xl leading-[0.92] tracking-wide">Satu akun.<br /><span className="text-war-gold">Semua momen.</span></h2>
          <p className="mt-6 max-w-md text-sm leading-7 text-muted-foreground">Masuk sebelum penjualan dimulai agar posisi antrean, reservasi, dan tiket tetap terhubung dengan aman.</p>
        </div>
        <div className="relative grid gap-3 sm:grid-cols-3">
          {[{ icon: Zap, label: 'Antrean cepat' }, { icon: LockKeyhole, label: 'Checkout aman' }, { icon: ShieldCheck, label: 'Tiket terlindungi' }].map(({ icon: Icon, label }) => (
            <div key={label} className="rounded-xl border border-white/8 bg-black/25 p-4 text-xs font-semibold text-foreground"><Icon className="mb-3 size-5 text-war-gold" />{label}</div>
          ))}
        </div>
      </aside>

      <section className="flex items-center justify-center py-6">
        <div className="w-full max-w-lg">
          <p className="section-label mb-4">{eyebrow}</p>
          <h1 className="font-display text-5xl leading-none tracking-wide sm:text-6xl">{title}</h1>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">{description}</p>
          <div className="glass-panel mt-8 rounded-2xl p-5 sm:p-8">{children}</div>
        </div>
      </section>
    </main>
  )
}
