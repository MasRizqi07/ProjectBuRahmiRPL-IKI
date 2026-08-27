import type { Metadata } from 'next'
import { Bebas_Neue, Plus_Jakarta_Sans, Space_Mono } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { AppProviders } from '@/components/app-providers'
import { SiteFooter } from '@/components/layout/site-footer'
import { SiteHeader } from '@/components/layout/site-header'
import './globals.css'

const bebasNeue = Bebas_Neue({
  subsets: ['latin'],
  variable: '--font-bebas',
  weight: '400',
})

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-plus-jakarta',
  weight: ['400', '500', '600', '700', '800'],
})

const spaceMono = Space_Mono({
  subsets: ['latin'],
  variable: '--font-space-mono',
  weight: ['400', '700'],
})

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'),
  title: 'WAR TICKET - Platform Tiket Konser Indonesia',
  description: 'Platform tiket konser Indonesia paling kompetitif dengan ribuan penawaran terbaik',
  icons: {
    icon: [
      {
        url: '/icon-light-32x32.png',
        media: '(prefers-color-scheme: light)',
      },
      {
        url: '/icon-dark-32x32.png',
        media: '(prefers-color-scheme: dark)',
      },
      {
        url: '/icon.svg',
        type: 'image/svg+xml',
      },
    ],
    apple: '/apple-icon.png',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="id" className={`dark ${bebasNeue.variable} ${plusJakartaSans.variable} ${spaceMono.variable}`}>
      <body className="font-body antialiased">
        <AppProviders>
          <a href="#main-content" className="sr-only fixed left-4 top-4 z-[100] rounded-lg bg-primary px-4 py-2 font-bold text-primary-foreground focus:not-sr-only">
            Lewati navigasi
          </a>
          <div className="flex min-h-screen flex-col">
            <SiteHeader />
            <div className="flex flex-1 flex-col">{children}</div>
            <SiteFooter />
          </div>
          {process.env.NODE_ENV === 'production' && <Analytics />}
        </AppProviders>
      </body>
    </html>
  )
}
