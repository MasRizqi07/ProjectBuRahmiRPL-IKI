'use client'

import { useCallback, useEffect, useState } from 'react'
import { Download, FileClock, ShieldCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { InlineAlert } from '@/components/feedback/inline-alert'
import { LoadingState } from '@/components/feedback/loading-state'
import { apiJson } from '@/lib/client/api'

interface Log {
  readonly id: number
  readonly tenant_id: string | null
  readonly actor_user_id: string | null
  readonly action: string
  readonly aggregate_type: string
  readonly aggregate_id: string | null
  readonly occurred_at: string
}

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<readonly Log[] | null>(null)
  const [cursor, setCursor] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(
    async (append = false): Promise<void> => {
      try {
        const body = (await apiJson(
          `/api/admin/audit${append && cursor ? `?cursor=${cursor}` : ''}`,
        )) as { logs: Log[]; nextCursor: number | null }
        setLogs((current) =>
          append ? [...(current ?? []), ...body.logs] : body.logs,
        )
        setCursor(body.nextCursor)
        setError(null)
      } catch (cause) {
        setError(
          cause instanceof Error ? cause.message : 'Audit log gagal dimuat.',
        )
      }
    },
    [cursor],
  )

  useEffect(() => {
    void load(false)
  }, [])

  return (
    <main id="main-content" className="container-shell space-y-8 py-8 sm:py-10">
      <header className="flex flex-col justify-between gap-4 border-b border-white/10 pb-6 sm:flex-row sm:items-end">
        <div>
          <span className="section-label">IMMUTABLE GOVERNANCE</span>
          <h1 className="mt-2 font-display text-4xl sm:text-5xl">SYSTEM AUDIT LOG</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Catatan mutasi data terenkripsi dan append-only untuk kepatuhan platform & audit keamanan.
          </p>
        </div>
        <Button asChild variant="outline" className="rounded-xl border-white/10">
          <a href="/api/admin/audit?format=csv" className="flex items-center gap-2">
            <Download className="size-4" />
            Ekspor CSV
          </a>
        </Button>
      </header>

      {error && <InlineAlert variant="error">{error}</InlineAlert>}

      {!logs ? (
        <LoadingState label="Memuat jejak audit platform…" />
      ) : logs.length === 0 ? (
        <div className="glass-panel flex flex-col items-center justify-center rounded-3xl p-12 text-center">
          <div className="flex size-14 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-war-gold">
            <ShieldCheck className="size-7" />
          </div>
          <h3 className="mt-4 font-display text-2xl text-foreground">
            Belum Ada Log Tercatat
          </h3>
          <p className="mt-1 max-w-sm text-xs text-muted-foreground">
            Setiap mutasi sistem sensitif (persetujuan event, alokasi kursi, refund) akan tercatat otomatis di sini.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="glass-panel overflow-hidden rounded-2xl border border-white/10">
            <Table>
              <TableHeader>
                <TableRow className="border-white/10 bg-white/5 hover:bg-white/5">
                  <TableHead className="w-20">ID</TableHead>
                  <TableHead>Aksi</TableHead>
                  <TableHead>Target Agregat</TableHead>
                  <TableHead>Aktor</TableHead>
                  <TableHead className="text-right">Waktu (WIB)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.map((log) => (
                  <TableRow key={log.id} className="border-white/8 hover:bg-white/4">
                    <TableCell className="font-mono text-xs text-muted-foreground">
                      #{log.id}
                    </TableCell>
                    <TableCell className="font-mono font-bold text-war-gold">
                      {log.action}
                    </TableCell>
                    <TableCell className="text-xs">
                      <span className="font-semibold text-foreground/90">{log.aggregate_type}</span>
                      {log.aggregate_id && (
                        <span className="ml-1.5 font-mono text-[11px] text-muted-foreground">
                          ({log.aggregate_id.slice(0, 8)}…)
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">
                      {log.actor_user_id ? log.actor_user_id.slice(0, 10) : 'system'}
                    </TableCell>
                    <TableCell className="text-right font-mono text-xs text-muted-foreground">
                      {new Date(log.occurred_at).toLocaleString('id-ID')}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {cursor !== null && (
            <div className="flex justify-center pt-2">
              <Button
                variant="outline"
                onClick={() => void load(true)}
                className="gap-2 rounded-xl border-white/10 hover:border-war-gold/40"
              >
                <FileClock className="size-4 text-war-gold" />
                Muat entri sebelumnya
              </Button>
            </div>
          )}
        </div>
      )}
    </main>
  )
}
