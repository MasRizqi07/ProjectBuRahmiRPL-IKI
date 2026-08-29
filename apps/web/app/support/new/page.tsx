'use client'

import { useState } from 'react'
import { Send } from 'lucide-react'
import { InlineAlert } from '@/components/feedback/inline-alert'
import { PageShell } from '@/components/layout/page-shell'
import { Button } from '@/components/ui/button'
import { apiJson } from '@/lib/client/api'

export default function NewSupportCasePage() {
  const [subject, setSubject] = useState('')
  const [description, setDescription] = useState('')
  const [orderId, setOrderId] = useState('')
  const [result, setResult] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const submit = async (event: React.FormEvent): Promise<void> => {
    event.preventDefault()
    setSubmitting(true); setError(null); setResult(null)
    try {
      const response = await apiJson('/api/support', { method: 'POST', body: JSON.stringify({ subject, description, ...(orderId ? { orderId } : {}) }) }) as { id: string }
      setResult(response.id)
      setSubject(''); setDescription(''); setOrderId('')
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Laporan gagal dikirim.')
    } finally { setSubmitting(false) }
  }

  return <PageShell eyebrow="Response Team" title="Ajukan tiket bantuan" description="Laporan tersimpan dan dapat ditindaklanjuti oleh tim support.">
    {result && <InlineAlert variant="success">Laporan dibuat dengan ID {result}.</InlineAlert>}{error && <InlineAlert variant="error">{error}</InlineAlert>}
    <form onSubmit={(event) => void submit(event)} className="mt-6 space-y-5 rounded-3xl border border-white/10 bg-[#141413] p-6">
      <label className="block text-xs font-bold uppercase text-muted-foreground">Order ID (opsional)<input value={orderId} onChange={(event) => setOrderId(event.target.value)} className="mt-2 w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-foreground" /></label>
      <label className="block text-xs font-bold uppercase text-muted-foreground">Subjek<input value={subject} onChange={(event) => setSubject(event.target.value)} minLength={5} maxLength={160} required className="mt-2 w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-foreground" /></label>
      <label className="block text-xs font-bold uppercase text-muted-foreground">Detail<textarea value={description} onChange={(event) => setDescription(event.target.value)} minLength={20} maxLength={5000} required rows={7} className="mt-2 w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-foreground" /></label>
      <Button type="submit" disabled={submitting}><Send />{submitting ? 'Mengirim…' : 'Kirim laporan'}</Button>
    </form>
  </PageShell>
}
