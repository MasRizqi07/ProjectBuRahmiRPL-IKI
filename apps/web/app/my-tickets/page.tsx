'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  ArrowRight,
  Calendar,
  CheckCircle2,
  Clock,
  Download,
  Filter,
  MapPin,
  QrCode,
  Search,
  Share2,
  Sparkles,
  Ticket,
  XCircle,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { MetallicTicketCard, type TicketDetails } from '@/components/ui/metallic-ticket-card'
import { formatIDR } from '@/lib/utils/format'

interface OrderItem {
  id: string
  orderNumber: string
  concertTitle: string
  artist: string
  date: string
  time: string
  venue: string
  city: string
  tierName: string
  quantity: number
  totalPrice: number
  status: 'upcoming' | 'completed' | 'cancelled'
  ticketDetails: TicketDetails
}

const mockOrders: OrderItem[] = [
  {
    id: 'ord-1',
    orderNumber: 'WT-2026-X8910',
    concertTitle: 'Coldplay Live Jakarta 2026',
    artist: 'Coldplay',
    date: '20 Mei 2026',
    time: '19:00 WIB',
    venue: 'Stadion Utama Gelora Bung Karno',
    city: 'Jakarta',
    tierName: 'VIP STANDING',
    quantity: 2,
    totalPrice: 7000000,
    status: 'upcoming',
    ticketDetails: {
      orderId: 'WT-2026-X8910',
      ticketCode: 'WT-QR-8910-VIPA',
      concertTitle: 'Coldplay Live Jakarta 2026',
      artist: 'Coldplay',
      venue: 'Stadion Utama Gelora Bung Karno',
      city: 'Jakarta',
      eventDate: '20 Mei 2026',
      eventTime: '19:00',
      gateOpen: '16:30',
      tierName: 'VIP STANDING',
      section: 'Zone VIP-A',
      seatNumber: 'A-142',
      holderName: 'Rizqi Pratama',
      nik: '317101******0004',
      price: 3500000,
      status: 'valid',
    },
  },
  {
    id: 'ord-2',
    orderNumber: 'WT-2026-B1029',
    concertTitle: 'Dewa 19 All Stars Reunion',
    artist: 'Dewa 19',
    date: '03 Juni 2026',
    time: '18:30 WIB',
    venue: 'Allianz Stadium',
    city: 'Jakarta',
    tierName: 'CAT 1 CENTER',
    quantity: 1,
    totalPrice: 850000,
    status: 'upcoming',
    ticketDetails: {
      orderId: 'WT-2026-B1029',
      ticketCode: 'WT-QR-1029-CAT1',
      concertTitle: 'Dewa 19 All Stars Reunion',
      artist: 'Dewa 19',
      venue: 'Allianz Stadium',
      city: 'Jakarta',
      eventDate: '03 Juni 2026',
      eventTime: '18:30',
      gateOpen: '16:00',
      tierName: 'CAT 1 CENTER',
      section: 'Tribun Timur',
      seatNumber: 'Row C - 12',
      holderName: 'Rizqi Pratama',
      nik: '317101******0004',
      price: 850000,
      status: 'valid',
    },
  },
  {
    id: 'ord-3',
    orderNumber: 'WT-2025-P9012',
    concertTitle: 'Pamungkas Acoustic Night',
    artist: 'Pamungkas',
    date: '15 Desember 2025',
    time: '20:00 WIB',
    venue: 'Mainstage Festival',
    city: 'Bandung',
    tierName: 'FESTIVAL',
    quantity: 2,
    totalPrice: 500000,
    status: 'completed',
    ticketDetails: {
      orderId: 'WT-2025-P9012',
      ticketCode: 'WT-QR-9012-FEST',
      concertTitle: 'Pamungkas Acoustic Night',
      artist: 'Pamungkas',
      venue: 'Mainstage Festival',
      city: 'Bandung',
      eventDate: '15 Desember 2025',
      eventTime: '20:00',
      gateOpen: '18:00',
      tierName: 'FESTIVAL',
      section: 'General Area',
      seatNumber: 'Standing',
      holderName: 'Rizqi Pratama',
      nik: '317101******0004',
      price: 250000,
      status: 'used',
    },
  },
]

export default function MyTicketsPage() {
  const [activeTab, setActiveTab] = useState<'upcoming' | 'completed' | 'cancelled'>('upcoming')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedTicket, setSelectedTicket] = useState<TicketDetails | null>(null)

  const filteredOrders = mockOrders.filter(
    (order) =>
      order.status === activeTab &&
      (order.concertTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.artist.toLowerCase().includes(searchQuery.toLowerCase()))
  )

  return (
    <main className="container-shell py-8 sm:py-12 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-end justify-between gap-4 border-b border-white/10 pb-6">
        <div>
          <span className="section-label">USER PORTAL</span>
          <h1 className="mt-2 font-display text-4xl sm:text-5xl tracking-wide text-foreground">
            TIKET & RIWAYAT PESANAN
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-muted-foreground">
            Akses e-ticket digital kamu, cek instruksi gate, dan kelola invoice konser.
          </p>
        </div>
        <Link
          href="/concerts"
          className="rounded-xl border border-war-gold/30 bg-war-gold/10 px-5 py-2.5 text-xs font-bold text-war-gold-bright hover:bg-war-gold/20 transition"
        >
          Cari Konser Lainnya <ArrowRight className="inline size-4 ml-1" />
        </Link>
      </div>

      {/* Tabs & Search Filter */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        {/* Tabs */}
        <div className="flex rounded-2xl border border-white/10 bg-black/40 p-1.5 backdrop-blur-xl">
          {[
            { key: 'upcoming', label: 'Tiket Mendatang', count: 2 },
            { key: 'completed', label: 'Selesai', count: 1 },
            { key: 'cancelled', label: 'Dibatalkan', count: 0 },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-all ${
                activeTab === tab.key
                  ? 'bg-war-gold text-black shadow-[0_0_15px_rgba(240,180,41,0.3)]'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <span>{tab.label}</span>
              <span
                className={`rounded-full px-1.5 py-0.2 text-[10px] font-bold ${
                  activeTab === tab.key ? 'bg-black text-war-gold' : 'bg-white/10 text-muted-foreground'
                }`}
              >
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari nomor order atau event..."
            className="w-full rounded-xl border border-white/10 bg-white/5 pl-10 pr-4 py-2.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-hidden focus:border-war-gold"
          />
        </div>
      </div>

      {/* Orders List */}
      {filteredOrders.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-white/10 p-12 text-center">
          <Ticket className="size-12 mx-auto text-muted-foreground/50 mb-3" />
          <h3 className="font-display text-2xl text-foreground">Tidak Ada Pesanan</h3>
          <p className="text-xs text-muted-foreground mt-1">
            Belum ada data tiket untuk kategori ini.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredOrders.map((order) => (
            <div
              key={order.id}
              className="rounded-2xl border border-white/10 bg-[#141413] p-6 hover:border-war-gold/30 transition-all flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 shadow-lg"
            >
              {/* Order Info */}
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono text-xs font-bold text-war-gold">
                    {order.orderNumber}
                  </span>
                  <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-0.5 text-[10px] font-bold text-muted-foreground">
                    {order.tierName} • {order.quantity} Tiket
                  </span>
                  {order.status === 'upcoming' && (
                    <span className="rounded-full border border-status-success/30 bg-status-success/10 px-2 py-0.5 text-[10px] font-bold text-status-success">
                      AKTIF & TERVERIFIKASI
                    </span>
                  )}
                </div>

                <h3 className="font-display text-2xl sm:text-3xl text-foreground">
                  {order.concertTitle}
                </h3>

                <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1.5">
                    <Calendar className="size-3.5 text-war-gold" /> {order.date} ({order.time})
                  </span>
                  <span className="flex items-center gap-1.5">
                    <MapPin className="size-3.5 text-war-gold" /> {order.venue}, {order.city}
                  </span>
                </div>
              </div>

              {/* Price & Actions */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 w-full lg:w-auto shrink-0 justify-between lg:justify-end border-t lg:border-t-0 border-white/8 pt-4 lg:pt-0">
                <div className="text-left lg:text-right">
                  <p className="text-[10px] uppercase font-bold text-muted-foreground">Total Bayar</p>
                  <p className="font-display text-2xl font-bold text-war-gold-bright">
                    {formatIDR(order.totalPrice)}
                  </p>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <Button
                    onClick={() => setSelectedTicket(order.ticketDetails)}
                    className="flex-1 sm:flex-initial rounded-xl bg-primary px-5 font-bold text-primary-foreground hover:bg-war-gold-bright shadow-[0_0_15px_rgba(240,180,41,0.2)]"
                  >
                    <QrCode className="size-4 mr-2" /> Buka E-Ticket
                  </Button>
                  <Button
                    variant="outline"
                    className="rounded-xl border-white/10 bg-white/5 hover:border-war-gold/40 hover:bg-white/10"
                    title="Unduh Invoice"
                  >
                    <Download className="size-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Ticket Modal Preview */}
      {selectedTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-xl animate-fade-up">
          <div className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-3xl border border-white/15 bg-[#121211] p-6 shadow-2xl">
            <button
              onClick={() => setSelectedTicket(null)}
              className="absolute top-4 right-4 z-20 rounded-full bg-white/10 p-2 text-muted-foreground hover:text-foreground"
            >
              ✕
            </button>
            <h3 className="mb-4 font-display text-2xl text-foreground text-center">
              E-TICKET RESMI
            </h3>
            <MetallicTicketCard ticket={selectedTicket} />
          </div>
        </div>
      )}
    </main>
  )
}
