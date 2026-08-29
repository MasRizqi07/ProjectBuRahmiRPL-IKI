import { PDFDocument, StandardFonts, rgb } from 'pdf-lib'
import { uuidSchema } from '@war-ticket/contracts'
import { apiError, requireUser } from '@/lib/server/api'
import { buyerRepository } from '@/lib/server/runtime'

interface RouteContext { readonly params: Promise<{ ticketId: string }> }

export async function GET(request: Request, context: RouteContext): Promise<Response> {
  try {
    const user = await requireUser()
    const ticketId = uuidSchema.parse((await context.params).ticketId)
    const ticket = await buyerRepository().getTicket(ticketId, user.id)
    const document = await PDFDocument.create()
    const page = document.addPage([595, 842])
    const font = await document.embedFont(StandardFonts.Helvetica)
    const bold = await document.embedFont(StandardFonts.HelveticaBold)
    page.drawRectangle({ x: 38, y: 520, width: 519, height: 260, color: rgb(0.06, 0.06, 0.055), borderColor: rgb(0.94, 0.7, 0.16), borderWidth: 2 })
    page.drawText('WAR TICKET — E-TICKET RESMI', { x: 62, y: 742, size: 20, font: bold, color: rgb(0.94, 0.7, 0.16) })
    page.drawText(ticket.eventTitle, { x: 62, y: 700, size: 18, font: bold, color: rgb(1, 1, 1) })
    page.drawText(new Date(ticket.startsAt).toLocaleString('id-ID'), { x: 62, y: 670, size: 11, font, color: rgb(0.8, 0.8, 0.8) })
    page.drawText(ticket.label, { x: 62, y: 635, size: 13, font: bold, color: rgb(1, 1, 1) })
    page.drawText(`Kode tiket: ${ticket.ticketCode}`, { x: 62, y: 600, size: 12, font, color: rgb(0.94, 0.7, 0.16) })
    page.drawText(`Status: ${ticket.status}`, { x: 62, y: 575, size: 11, font, color: rgb(0.8, 0.8, 0.8) })
    page.drawText('QR masuk hanya tersedia secara dinamis di akun pemilik tiket.', { x: 62, y: 545, size: 9, font, color: rgb(0.7, 0.7, 0.7) })
    const bytes = await document.save()
    return new Response(Buffer.from(bytes), {
      headers: {
        'content-type': 'application/pdf',
        'content-disposition': `attachment; filename="war-ticket-${ticket.ticketCode}.pdf"`,
        'cache-control': 'private, no-store',
      },
    })
  } catch (error) {
    return apiError(error, request)
  }
}
