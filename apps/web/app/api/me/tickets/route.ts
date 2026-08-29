import { apiError, requireUser } from '@/lib/server/api'
import { buyerRepository } from '@/lib/server/runtime'

export async function GET(request: Request): Promise<Response> {
  try {
    const user = await requireUser()
    const tickets = await buyerRepository().listTickets(user.id)
    return Response.json({ tickets }, { headers: { 'cache-control': 'private, no-store' } })
  } catch (error) {
    return apiError(error, request)
  }
}
