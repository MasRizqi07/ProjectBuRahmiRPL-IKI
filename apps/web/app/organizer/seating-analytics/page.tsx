'use client'

import { useState } from 'react'
import {
  Activity,
  ArrowUpRight,
  BarChart3,
  Calendar,
  Flame,
  Info,
  MapPin,
  Maximize2,
  PieChart,
  Sparkles,
  TrendingUp,
  Users,
} from 'lucide-react'
import { Button } from '@/components/ui/button'

interface SectionData {
  id: string
  name: string
  capacity: number
  sold: number
  price: number
  revenue: number
  speed: string
  fill: string
  status: string
}

const sectionsData: SectionData[] = [
  { id: 'vip', name: 'VIP FRONT STAGE', capacity: 500, sold: 500, price: 3500000, revenue: 1750000000, speed: '12 detik', fill: '#EF4444', status: 'SOLD OUT 🔥' },
  { id: 'cat1', name: 'CAT 1 CENTER', capacity: 1200, sold: 1140, price: 1850000, revenue: 2109000000, speed: '45 detik', fill: '#F0B429', status: '95% TERJUAL' },
  { id: 'cat2', name: 'CAT 2 WINGS', capacity: 1500, sold: 1250, price: 1200000, revenue: 1500000000, speed: '1.5 menit', fill: '#5bc9ff', status: '83% TERJUAL' },
  { id: 'fest', name: 'FESTIVAL GENERAL', capacity: 3000, sold: 1800, price: 750000, revenue: 1350000000, speed: '3 menit', fill: '#10B981', status: '60% TERJUAL' },
]

export default function SeatingAnalyticsPage() {
  const [selectedSection, setSelectedSection] = useState<SectionData>(sectionsData[0]!)

  const formatRupiah = (val: number) =>
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val)

  return (
    <div className="space-y-8 max-w-7xl">
      {/* Header */}
      <div className="border-b border-white/10 pb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <span className="section-label">VENUE & INVENTORY INTELLIGENCE</span>
          <h1 className="mt-2 font-display text-4xl sm:text-5xl tracking-wide text-foreground">
            SEATING ANALYTICS & HEATMAP
          </h1>
          <p className="text-xs text-muted-foreground">
            Visualisasi distribusi penjualan kursi, kecepatan sell-out tribun, dan rasio konversi per zona venue.
          </p>
        </div>

        <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-black/40 px-4 py-2 text-xs">
          <span className="text-muted-foreground">Event:</span>
          <strong className="text-war-gold">Coldplay Live Jakarta 2026</strong>
        </div>
      </div>

      {/* Heatmap & Section Highlight Grid */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* SVG Heatmap Canvas (7 cols) */}
        <div className="lg:col-span-7 rounded-3xl border border-white/10 bg-[#141413] p-6 sm:p-8 flex flex-col items-center justify-between shadow-xl relative overflow-hidden">
          <div className="w-full flex items-center justify-between border-b border-white/8 pb-4">
            <h3 className="font-display text-2xl text-foreground">Visual Stadium Heatmap</h3>
            <span className="text-[11px] font-mono text-status-success">REAL-TIME TELEMETRY</span>
          </div>

          {/* SVG Heatmap */}
          <div className="my-6 w-full max-w-md aspect-square relative flex items-center justify-center">
            <svg viewBox="0 0 500 500" className="size-full drop-shadow-2xl">
              {/* Stage */}
              <path d="M 140 90 Q 250 45 360 90 L 360 115 Q 250 75 140 115 Z" fill="#333" stroke="#F0B429" strokeWidth="1.5" />
              <text x="250" y="105" textAnchor="middle" fill="#F0B429" fontFamily="Plus Jakarta Sans" fontSize="12" fontWeight="800">STAGE</text>

              {/* VIP (Heat Red) */}
              <path
                d="M 180 160 Q 250 130 320 160 L 340 205 Q 250 165 160 205 Z"
                fill="#EF4444"
                opacity={selectedSection.id === 'vip' ? 1 : 0.75}
                stroke={selectedSection.id === 'vip' ? '#FFF' : '#EF4444'}
                strokeWidth={selectedSection.id === 'vip' ? 3 : 1}
                className="cursor-pointer transition-all hover:opacity-100"
                onClick={() => setSelectedSection(sectionsData[0]!)}
              />

              {/* CAT 1 (Heat Gold) */}
              <path
                d="M 120 230 Q 250 175 380 230 L 410 295 Q 250 220 90 295 Z"
                fill="#F0B429"
                opacity={selectedSection.id === 'cat1' ? 1 : 0.7}
                stroke={selectedSection.id === 'cat1' ? '#FFF' : '#F0B429'}
                strokeWidth={selectedSection.id === 'cat1' ? 3 : 1}
                className="cursor-pointer transition-all hover:opacity-100"
                onClick={() => setSelectedSection(sectionsData[1]!)}
              />

              {/* CAT 2 (Heat Cyan) */}
              <path
                d="M 70 320 Q 250 245 430 320 L 460 385 Q 250 295 40 385 Z"
                fill="#5bc9ff"
                opacity={selectedSection.id === 'cat2' ? 1 : 0.65}
                stroke={selectedSection.id === 'cat2' ? '#FFF' : '#5bc9ff'}
                strokeWidth={selectedSection.id === 'cat2' ? 3 : 1}
                className="cursor-pointer transition-all hover:opacity-100"
                onClick={() => setSelectedSection(sectionsData[2]!)}
              />

              {/* Festival (Heat Green) */}
              <path
                d="M 20 410 Q 250 320 480 410 L 490 455 Q 250 375 10 455 Z"
                fill="#10B981"
                opacity={selectedSection.id === 'fest' ? 1 : 0.55}
                stroke={selectedSection.id === 'fest' ? '#FFF' : '#10B981'}
                strokeWidth={selectedSection.id === 'fest' ? 3 : 1}
                className="cursor-pointer transition-all hover:opacity-100"
                onClick={() => setSelectedSection(sectionsData[3]!)}
              />
            </svg>
          </div>

          {/* Heat Legend */}
          <div className="flex flex-wrap items-center justify-center gap-4 text-xs">
            <div className="flex items-center gap-1.5"><span className="size-3 rounded-sm bg-urgent-red" /> Sold Out (100%)</div>
            <div className="flex items-center gap-1.5"><span className="size-3 rounded-sm bg-war-gold" /> High Demand (&gt;80%)</div>
            <div className="flex items-center gap-1.5"><span className="size-3 rounded-sm bg-cyan-400" /> Medium (&gt;50%)</div>
            <div className="flex items-center gap-1.5"><span className="size-3 rounded-sm bg-emerald-400" /> Low (Stok Banyak)</div>
          </div>
        </div>

        {/* Selected Zone Deep Dive (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="rounded-3xl border border-white/10 bg-[#141413] p-6 sm:p-8 space-y-6 shadow-xl">
            <div className="flex items-start justify-between border-b border-white/8 pb-4">
              <div>
                <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">DETAIL SEKTOR TERPILIH</span>
                <h3 className="font-display text-3xl text-war-gold-bright mt-1">{selectedSection.name}</h3>
              </div>
              <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-bold text-foreground">
                {selectedSection.status}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-2xl bg-black/40 p-4">
                <span className="text-[10px] uppercase text-muted-foreground">Tiket Terjual</span>
                <p className="font-display text-2xl text-foreground mt-1">
                  {selectedSection.sold} / {selectedSection.capacity}
                </p>
                <p className="text-[11px] text-status-success font-semibold">
                  {Math.round((selectedSection.sold / selectedSection.capacity) * 100)}% Terisi
                </p>
              </div>

              <div className="rounded-2xl bg-black/40 p-4">
                <span className="text-[10px] uppercase text-muted-foreground">Total Revenue</span>
                <p className="font-display text-2xl text-war-gold mt-1">
                  {formatRupiah(selectedSection.revenue)}
                </p>
                <p className="text-[11px] text-muted-foreground font-semibold">
                  @ {formatRupiah(selectedSection.price)}
                </p>
              </div>
            </div>

            <div className="space-y-2 border-t border-white/8 pt-4">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Kecepatan Habis (Sellout Velocity)</span>
                <strong className="text-foreground">{selectedSection.speed}</strong>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Tingkat Konversi Checkout</span>
                <strong className="text-status-success">98.4%</strong>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Drop-off Rate di Antrean</span>
                <strong className="text-muted-foreground">1.6%</strong>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Full Tier Breakdown Table */}
      <section className="rounded-3xl border border-white/10 bg-[#141413] p-6 sm:p-8 space-y-6">
        <h3 className="font-display text-2xl text-foreground">Rincian Performa Seluruh Sektor</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-white/10 text-muted-foreground">
                <th className="pb-3 uppercase font-bold">Nama Sektor</th>
                <th className="pb-3 uppercase font-bold">Harga Tiket</th>
                <th className="pb-3 uppercase font-bold">Terjual / Kuota</th>
                <th className="pb-3 uppercase font-bold">Gross Revenue</th>
                <th className="pb-3 uppercase font-bold text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-foreground">
              {sectionsData.map((sec) => (
                <tr key={sec.id} className="hover:bg-white/4 cursor-pointer" onClick={() => setSelectedSection(sec)}>
                  <td className="py-4 font-bold flex items-center gap-2">
                    <span className="size-2.5 rounded-full" style={{ backgroundColor: sec.fill }} />
                    {sec.name}
                  </td>
                  <td className="py-4 font-mono">{formatRupiah(sec.price)}</td>
                  <td className="py-4 font-mono">{sec.sold} / {sec.capacity}</td>
                  <td className="py-4 font-mono font-bold text-war-gold">{formatRupiah(sec.revenue)}</td>
                  <td className="py-4 text-right">
                    <span className="rounded-full bg-white/10 px-2.5 py-1 text-[10px] font-bold text-foreground">
                      {sec.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}
