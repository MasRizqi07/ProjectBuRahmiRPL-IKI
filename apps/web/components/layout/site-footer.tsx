import Link from 'next/link'

const footerLinks = [
  { href: '/concerts', label: 'Jelajahi konser' },
  { href: '/my-tickets', label: 'Tiket saya' },
  { href: '/login', label: 'Masuk' },
] as const

export function SiteFooter() {
  return (
    <footer className="border-t border-white/8 bg-surface-lowest/80">
      <div className="container-shell grid gap-8 py-10 sm:grid-cols-[1fr_auto] sm:items-end">
        <div>
          <p className="font-display text-3xl tracking-wide text-war-gold">WAR TICKET</p>
          <p className="mt-2 max-w-md text-sm leading-6 text-muted-foreground">Platform tiket berkecepatan tinggi untuk momen yang tidak datang dua kali.</p>
        </div>
        <nav className="flex flex-wrap gap-x-6 gap-y-3 text-sm text-muted-foreground" aria-label="Navigasi footer">
          {footerLinks.map((link) => <Link key={link.href} href={link.href} className="transition-colors hover:text-war-gold">{link.label}</Link>)}
        </nav>
        <p className="text-xs text-muted-foreground sm:col-span-2">© {new Date().getFullYear()} WAR TICKET. Seluruh hak dilindungi.</p>
      </div>
    </footer>
  )
}
