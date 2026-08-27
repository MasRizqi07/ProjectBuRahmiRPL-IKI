import { createReservationRequestSchema } from '@war-ticket/contracts'
import { apiError, assertSameOrigin, parseJson, requireUser } from '@/lib/server/api'
import { inventoryRepository, queueService } from '@/lib/server/runtime'

export async function POST(request: Request): Promise<Response> {
  try {
    assertSameOrigin(request)
    const user = await requireUser()
    const input = await parseJson(request, createReservationRequestSchema)
    const queue = queueService()
    const admission = queue.validateAdmissionToken({
      token: input.admissionToken,
      salesSessionId: input.salesSessionId,
      userId: user.id,
    })
    const reservation = await inventoryRepository().createReservation({
      ...input,
      userId: user.id,
      admissionEntryId: admission.entryId,
    })
    try {
      await queue.consumeAdmissionToken({
        token: input.admissionToken,
        salesSessionId: input.salesSessionId,
        userId: user.id,
      })
    } catch {
      // PostgreSQL uniqueness is the replay barrier. Redis consumption is best-effort
      // after commit so a transient Redis failure cannot discard a valid hold.
    }
    return Response.json(reservation, {
      status: 201,
      headers: { 'cache-control': 'no-store' },
    })
  } catch (error) {
    return apiError(error, request)
  }
}
