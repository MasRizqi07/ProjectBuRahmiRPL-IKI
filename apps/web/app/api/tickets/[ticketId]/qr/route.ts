import QRCode from 'qrcode'
import { uuidSchema } from '@war-ticket/contracts'
import { apiError, assertSameOrigin, requireUser } from '@/lib/server/api'
import { buyerRepository } from '@/lib/server/runtime'
import { issueTicketQrToken } from '@/lib/tickets/qr-token'

interface RouteContext { readonly params: Promise<{ ticketId: string }> }

export async function POST(request: Request, context: RouteContext): Promise<Response> {
  try {
    assertSameOrigin(request)
    const user = await requireUser()
    const ticketId = uuidSchema.parse((await context.params).ticketId)
    const issued = issueTicketQrToken(ticketId)
    await buyerRepository().storeQrToken({ ticketId, userId: user.id, tokenHash: issued.tokenHash, expiresAt: issued.expiresAt })
    const imageDataUrl = await QRCode.toDataURL(issued.token, { errorCorrectionLevel: 'M', margin: 1, width: 320 })
    return Response.json({ imageDataUrl, expiresAt: issued.expiresAt.toISOString() }, { headers: { 'cache-control': 'no-store' } })
  } catch (error) {
    return apiError(error, request)
  }
}
