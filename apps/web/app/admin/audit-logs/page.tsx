'use client'

import { useState } from 'react'
import {
  Download,
  Search,
} from 'lucide-react'
import { CapabilityNotice } from '@/components/feedback/capability-notice'
import { Button } from '@/components/ui/button'

interface LogEntry {
  id: string
  timestamp: string
  actor: string
  role: string
  ip: string
  action: string
  details: string
  level: 'CRITICAL' | 'WARN' | 'INFO'
}

type LogLevelFilter = 'ALL' | LogEntry['level']

const logLevelFilters: readonly LogLevelFilter[] = ['ALL', 'CRITICAL', 'WARN', 'INFO']

const auditLogs: LogEntry[] = [
  {
    id: 'LOG-77291',
    timestamp: '28 Agu 2026 15:42:19 WIB',
    actor: 'admin@warticket.id',
    role: 'SUPER_ADMIN',
    ip: '103.149.28.1',
    action: 'EVENT_APPROVED',
    details: 'Menyetujui rilis publik event #EVT-091 (Bruno Mars Jakarta).',
    level: 'INFO',
  },
  {
    id: 'LOG-77290',
    timestamp: '28 Agu 2026 15:38:05 WIB',
    actor: 'SYSTEM_FIREWALL',
    role: 'AI_BOT_SHIELD',
    ip: '185.220.101.5',
    action: 'IP_AUTOBANNED',
    details: 'Memblokir IP 185.220.101.5 karena lonjakan 250 TPS scraping antrean.',
    level: 'CRITICAL',
  },
  {
    id: 'LOG-77289',
    timestamp: '28 Agu 2026 15:15:22 WIB',
    actor: 'promoter_ismaya@live.com',
    role: 'PROMOTER_ADMIN',
    ip: '114.122.45.89',
    action: 'QUOTA_RELEASED',
    details: 'Merilis +500 tiket cadangan untuk tier CAT 1 Coldplay.',
    level: 'WARN',
  },
  {
    id: 'LOG-77288',
    timestamp: '28 Agu 2026 14:55:01 WIB',
    actor: 'GATE_01_SCANNER',
    role: 'OPERATOR',
    ip: '192.168.1.104',
    action: 'TICKET_CHECKIN',
    details: 'Check-in berhasil tiket #WT-2026-X8910 di Gate 1A VIP.',
    level: 'INFO',
  },
  {
    id: 'LOG-77287',
    timestamp: '28 Agu 2026 14:20:10 WIB',
    actor: 'budi.santoso@gmail.com',
    role: 'BUYER',
    ip: '180.252.12.9',
    action: 'DISPUTE_FILED',
    details: 'Mengajukan tiket sengketa refund double debit #DSP-8821.',
    level: 'WARN',
  },
]

export default function SystemAuditLogsPage() {
  const [search, setSearch] = useState('')
  const [selectedLevel, setSelectedLevel] = useState<LogLevelFilter>('ALL')

  const filtered = auditLogs.filter((l) => {
    if (selectedLevel !== 'ALL' && l.level !== selectedLevel) return false
    if (
      search &&
      !l.action.toLowerCase().includes(search.toLowerCase()) &&
      !l.details.toLowerCase().includes(search.toLowerCase()) &&
      !l.actor.toLowerCase().includes(search.toLowerCase())
    ) {
      return false
    }
    return true
  })

  return (
    <div className="space-y-8 max-w-7xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-white/10 pb-6">
        <div>
          <span className="section-label">COMPLIANCE & SYSTEM AUDITING</span>
          <h1 className="mt-2 font-display text-4xl sm:text-5xl tracking-wide text-foreground">
            AUDIT TRAIL & LOG SISTEM
          </h1>
          <p className="text-xs text-muted-foreground">
            Catatan log aktivitas tidak dapat diubah (immutable trail) untuk seluruh aksi administratif dan transaksi.
          </p>
        </div>

        <Button disabled title="Ekspor audit log belum tersedia" variant="outline" className="rounded-xl border-white/15 bg-white/5 text-xs font-bold hover:border-war-gold/40">
          <Download className="size-4 mr-1.5" /> Ekspor Log Terenkripsi
        </Button>
      </div>

      <CapabilityNotice capability="adminAuditExport" />

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari aksi, actor email, atau detail..."
            className="w-full rounded-xl border border-white/10 bg-[#141413] pl-10 pr-4 py-2.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-hidden focus:border-war-gold"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          {logLevelFilters.map((lvl) => (
            <button
              key={lvl}
              onClick={() => setSelectedLevel(lvl)}
              className={`rounded-xl px-3.5 py-2 text-xs font-mono font-bold transition ${
                selectedLevel === lvl
                  ? 'bg-war-gold text-black'
                  : 'border border-white/10 bg-white/4 text-muted-foreground hover:text-foreground'
              }`}
            >
              {lvl}
            </button>
          ))}
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="rounded-3xl border border-white/10 bg-[#141413] p-6 shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-white/10 text-muted-foreground">
                <th className="pb-3 uppercase font-bold">Severity</th>
                <th className="pb-3 uppercase font-bold">Timestamp</th>
                <th className="pb-3 uppercase font-bold">Actor / Identity</th>
                <th className="pb-3 uppercase font-bold">IP Source</th>
                <th className="pb-3 uppercase font-bold">Action Identifier</th>
                <th className="pb-3 uppercase font-bold">Event Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-foreground font-mono">
              {filtered.map((log) => (
                <tr key={log.id} className="hover:bg-white/4 transition">
                  <td className="py-4">
                    <span
                      className={`rounded-md px-2 py-0.5 text-[10px] font-black ${
                        log.level === 'CRITICAL'
                          ? 'bg-urgent-red/20 text-urgent-red border border-urgent-red/40'
                          : log.level === 'WARN'
                          ? 'bg-war-gold/20 text-war-gold border border-war-gold/40'
                          : 'bg-blue-500/20 text-blue-400'
                      }`}
                    >
                      {log.level}
                    </span>
                  </td>
                  <td className="py-4 text-muted-foreground">{log.timestamp}</td>
                  <td className="py-4">
                    <strong className="text-foreground">{log.actor}</strong>
                    <span className="block text-[10px] text-muted-foreground font-sans">{log.role}</span>
                  </td>
                  <td className="py-4 text-muted-foreground">{log.ip}</td>
                  <td className="py-4 font-bold text-war-gold-bright">{log.action}</td>
                  <td className="py-4 font-sans text-muted-foreground text-xs">{log.details}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
