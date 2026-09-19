import type { Metadata } from 'next'
import localFont from 'next/font/local'
import { Analytics } from '@vercel/analytics/next'
import { AppProviders } from '@/components/app-providers'
import { SiteFooter } from '@/components/layout/site-footer'
import { SiteHeader } from '@/components/layout/site-header'
import { getViewer } from '@/lib/auth/viewer'
import './globals.css'

const bebasNeue = localFont({
  src: './fonts/BebasNeue-Regular.woff2',
  variable: '--font-bebas',
  weight: '400',
  display: 'swap',
})

const plusJakartaSans = localFont({
  src: './fonts/PlusJakartaSans-VariableFont_wght.woff2',
  variable: '--font-plus-jakarta',
  display: 'swap',
})

const spaceMono = localFont({
  src: [
    {
      path: './fonts/SpaceMono-Regular.woff2',
      weight: '400',
      style: 'normal',
    },
    {
      path: './fonts/SpaceMono-Bold.woff2',
      weight: '700',
      style: 'normal',
    },
  ],
  variable: '--font-space-mono',
  display: 'swap',
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

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const viewer = await getViewer()

  return (
    <html lang="id" className={`dark ${bebasNeue.variable} ${plusJakartaSans.variable} ${spaceMono.variable}`}>
      <body className="font-body antialiased">
        <AppProviders>
          <a href="#main-content" className="sr-only fixed left-4 top-4 z-[100] rounded-lg bg-primary px-4 py-2 font-bold text-primary-foreground focus:not-sr-only">
            Lewati navigasi
          </a>
          <div className="flex min-h-screen flex-col">
            <SiteHeader viewer={viewer} />
            <div className="flex flex-1 flex-col">{children}</div>
            <SiteFooter />
          </div>
          {process.env.NODE_ENV === 'production' && <Analytics />}
        </AppProviders>
      </body>
    </html>
  )
}
