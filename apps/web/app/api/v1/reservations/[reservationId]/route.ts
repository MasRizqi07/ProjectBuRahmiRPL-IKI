import { uuidSchema } from '@war-ticket/contracts'
import { apiError, requireUser } from '@/lib/server/api'
import { catalogRepository } from '@/lib/server/runtime'

interface RouteContext {
  readonly params: Promise<{ reservationId: string }>
}

export async function GET(request: Request, context: RouteContext): Promise<Response> {
  try {
    const user = await requireUser()
    const { reservationId } = await context.params
    const reservation = await catalogRepository().getReservation(
      uuidSchema.parse(reservationId),
      user.id,
    )
    return Response.json(reservation, {
      headers: { 'cache-control': 'private, no-store' },
    })
  } catch (error) {
    return apiError(error, request)
  }
}
