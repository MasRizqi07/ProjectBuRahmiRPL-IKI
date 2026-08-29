import Link from 'next/link'
import { ShieldX } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function ForbiddenPage() {
  return (
    <main id="main-content" className="container-shell flex min-h-[65vh] items-center justify-center py-16">
      <section className="glass-panel max-w-lg rounded-3xl p-8 text-center">
        <ShieldX className="mx-auto size-12 text-status-danger" aria-hidden="true" />
        <p className="mt-5 text-xs font-black uppercase tracking-[0.25em] text-status-danger">Akses ditolak</p>
        <h1 className="mt-2 font-display text-4xl">Role akun tidak mencukupi</h1>
        <p className="mt-4 text-sm leading-6 text-muted-foreground">
          Portal ini memerlukan role yang diberikan oleh administrator atau pemilik organizer.
        </p>
        <Button asChild className="mt-7 rounded-xl"><Link href="/dashboard">Kembali ke dashboard</Link></Button>
      </section>
    </main>
  )
}
