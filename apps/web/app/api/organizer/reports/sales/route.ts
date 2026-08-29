import { PDFDocument, StandardFonts } from 'pdf-lib'
import { z } from 'zod'
import { requireTenantPermission } from '@/lib/auth/authorization'
import { apiError } from '@/lib/server/api'
import { database } from '@/lib/server/runtime'

const querySchema = z.object({ tenantId: z.string().uuid(), eventId: z.string().uuid().optional(), format: z.enum(['csv','pdf']).default('csv') })
const csv = (value: string | number): string => `"${String(value).replaceAll('"', '""')}"`

export async function GET(request: Request): Promise<Response> {
  try {
    const parsed = querySchema.parse(Object.fromEntries(new URL(request.url).searchParams))
    await requireTenantPermission(parsed.tenantId, 'VIEW')
    const rows = await database()<Array<{ order_id: string; event_title: string; status: string; total: number; created_at: Date }>>`
      select orders.id as order_id, event.title as event_title, orders.status, orders.total, orders.created_at
      from ticketing.orders orders
      join ticketing.reservations reservation on reservation.tenant_id = orders.tenant_id and reservation.id = orders.reservation_id
      join ticketing.events event on event.tenant_id = reservation.tenant_id and event.id = reservation.event_id
      where orders.tenant_id = ${parsed.tenantId} and (${parsed.eventId ?? null}::uuid is null or event.id = ${parsed.eventId ?? null})
      order by orders.created_at desc
    `
    if (parsed.format === 'csv') {
      const content = ['order_id,event_title,status,total,created_at', ...rows.map((row) => [row.order_id, row.event_title, row.status, row.total, row.created_at.toISOString()].map(csv).join(','))].join('\r\n')
      return new Response(content, { headers: { 'content-type': 'text/csv; charset=utf-8', 'content-disposition': 'attachment; filename="war-ticket-sales.csv"', 'cache-control': 'private, no-store' } })
    }
    const document = await PDFDocument.create(); const page = document.addPage([842, 595]); const font = await document.embedFont(StandardFonts.Helvetica); const bold = await document.embedFont(StandardFonts.HelveticaBold)
    page.drawText('WAR TICKET — SALES REPORT', { x: 36, y: 550, size: 18, font: bold })
    let y = 520
    for (const row of rows.slice(0, 30)) { page.drawText(`${row.order_id.slice(0, 8)}  ${row.event_title.slice(0, 36)}  ${row.status}  IDR ${row.total}`, { x: 36, y, size: 8, font }); y -= 16 }
    return new Response(Buffer.from(await document.save()), { headers: { 'content-type': 'application/pdf', 'content-disposition': 'attachment; filename="war-ticket-sales.pdf"', 'cache-control': 'private, no-store' } })
  } catch (error) { return apiError(error, request) }
}
