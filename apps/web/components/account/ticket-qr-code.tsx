'use client'

import { useEffect, useState } from 'react'
import QRCode from 'qrcode'
import { Download, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface TicketQrCodeProps {
  readonly ticketCode: string
}

export function TicketQrCode({ ticketCode }: TicketQrCodeProps) {
  const [dataUrl, setDataUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    QRCode.toDataURL(ticketCode, {
      width: 140,
      margin: 1,
      color: {
        dark: '#F0B429',
        light: '#141413',
      },
    })
      .then((url: string) => {
        if (!cancelled) {
          setDataUrl(url)
          setLoading(false)
        }
      })
      .catch((err: unknown) => {
        console.error('Failed to generate QR code:', err)
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [ticketCode])

  const handleDownload = () => {
    if (!dataUrl) return
    const link = document.createElement('a')
    link.href = dataUrl
    link.download = `ticket-${ticketCode}.png`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // TODO: Implement server-side rendered PDF export in future phase
  // TODO: Implement Apple Wallet / Google Wallet pass generation

  return (
    <div className="flex flex-col items-center justify-center gap-3 text-center">
      <div className="relative flex size-28 items-center justify-center overflow-hidden rounded-xl border border-war-gold/30 bg-[#141413] p-1 shadow-inner">
        {loading ? (
          <Loader2 className="size-6 animate-spin text-war-gold" />
        ) : dataUrl ? (
          <img
            src={dataUrl}
            alt={`QR Code tiket ${ticketCode}`}
            className="size-full object-contain"
          />
        ) : (
          <span className="text-[10px] text-muted-foreground">QR Error</span>
        )}
      </div>

      <div className="flex flex-col items-center gap-1.5 w-full">
        <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
          E-Ticket QR
        </p>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleDownload}
          disabled={!dataUrl}
          className="h-8 gap-1.5 px-2.5 text-[11px] font-semibold border-white/10 hover:border-war-gold/40 hover:text-war-gold"
        >
          <Download className="size-3.5" />
          Download PNG
        </Button>
      </div>
    </div>
  )
}
