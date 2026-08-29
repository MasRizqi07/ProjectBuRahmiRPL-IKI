import { z } from 'zod'
import { DomainError } from '@war-ticket/domain'
import { requireAnyTenantRole } from '@/lib/auth/authorization'
import { apiError, assertSameOrigin, parseJson } from '@/lib/server/api'
import { buyerRepository } from '@/lib/server/runtime'
import { hashTicketQrToken, verifyTicketQrToken } from '@/lib/tickets/qr-token'

const scanSchema = z.object({ token: z.string().min(40).max(2_000), gate: z.string().trim().min(1).max(80) })

export async function POST(request: Request): Promise<Response> {
  try {
    assertSameOrigin(request)
    const viewer = await requireAnyTenantRole()
    if (!['OWNER','ADMIN','OPERATOR'].includes(viewer.tenantRole)) throw new DomainError('FORBIDDEN', 'Gate operator role is required')
    const input = await parseJson(request, scanSchema)
    const claims = verifyTicketQrToken(input.token)
    const status = await buyerRepository().redeemTicket({ tokenHash: hashTicketQrToken(input.token), ticketId: claims.ticketId, actorUserId: viewer.id, authorizedTenantId: viewer.tenantId === '*' ? null : viewer.tenantId, gate: input.gate })
    return Response.json({ ticketId: claims.ticketId, status, redeemedAt: new Date().toISOString() })
  } catch (error) { return apiError(error, request) }
}
