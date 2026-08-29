import { LockKeyhole, ShieldCheck, ShieldX } from 'lucide-react'
import { isSupabaseConfigured } from '@/lib/supabase/config'

export const dynamic = 'force-dynamic'
const configured = (value: string | undefined, minimum = 1): boolean => Boolean(value && value.length >= minimum && !value.startsWith('replace-') && !value.startsWith('your-'))

export default function AdminSecurityPage() {
  const checks = [
    { name: 'Supabase Auth', ready: isSupabaseConfigured(), detail: 'Single identity provider and server session validation' },
    { name: 'PostgreSQL', ready: configured(process.env.DATABASE_URL), detail: 'Authoritative inventory, order, audit, and RBAC data' },
    { name: 'Redis queue', ready: configured(process.env.REDIS_URL), detail: 'Per-session queue and admission traffic plane' },
    { name: 'Queue signing', ready: configured(process.env.QUEUE_SIGNING_SECRET, 32), detail: 'Admission token signature' },
    { name: 'Ticket QR signing', ready: configured(process.env.TICKET_QR_SIGNING_SECRET, 32), detail: 'Short-lived replay-resistant gate token' },
    { name: 'Credential encryption', ready: configured(process.env.CREDENTIAL_ENCRYPTION_KEY, 32), detail: 'Merchant and buyer sensitive field encryption' },
  ]
  return <main id="main-content" className="container-shell max-w-4xl space-y-8 py-10"><header><span className="section-label">SECURITY POSTURE</span><h1 className="mt-2 font-display text-5xl">CONFIGURATION GATES</h1><p className="mt-2 text-sm text-muted-foreground">Status ini hanya memeriksa konfigurasi; bukan klaim uptime, throughput, atau hasil penetration test.</p></header><div className="grid gap-4 sm:grid-cols-2">{checks.map((check) => <article key={check.name} className={`rounded-2xl border p-5 ${check.ready ? 'border-status-success/30 bg-status-success/5' : 'border-status-danger/30 bg-status-danger/5'}`}>{check.ready ? <ShieldCheck className="text-status-success" /> : <ShieldX className="text-status-danger" />}<h2 className="mt-3 font-display text-2xl">{check.name}</h2><p className="mt-1 text-xs text-muted-foreground">{check.detail}</p><span className="mt-4 inline-flex items-center gap-2 text-xs font-bold"><LockKeyhole className="size-3" />{check.ready ? 'CONFIGURED' : 'DISABLED'}</span></article>)}</div></main>
}
