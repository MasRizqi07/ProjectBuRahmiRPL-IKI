import type { Metadata } from 'next'
import { Inter, Space_Grotesk } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { SessionProvider } from '@/components/session-provider'
import './globals.css'

const inter = Inter({ subsets: ["latin"], variable: '--font-sans' })
const spaceGrotesk = Space_Grotesk({ subsets: ["latin"], variable: '--font-display' })

export const metadata: Metadata = {
  title: 'WAR TICKET - Platform Tiket Konser Indonesia',
  description: 'Platform tiket konser Indonesia paling kompetitif dengan ribuan penawaran terbaik',
  generator: 'v0.app',
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
    <html lang="id" className={`${inter.variable} ${spaceGrotesk.variable} bg-zinc-950`}>
      <body className="font-sans antialiased bg-zinc-950">
        <SessionProvider>
          <div className="view-transition-name">{children}</div>
        </SessionProvider>
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
