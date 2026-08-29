import { z } from 'zod'
import { requireTenantPermission } from '@/lib/auth/authorization'
import { apiError } from '@/lib/server/api'
import { database } from '@/lib/server/runtime'

const querySchema = z.object({ eventId: z.string().uuid() })
export async function GET(request: Request): Promise<Response> {
  try {
    const { eventId } = querySchema.parse(Object.fromEntries(new URL(request.url).searchParams))
    const tenants = await database()<Array<{ tenant_id: string }>>`select tenant_id from ticketing.events where id = ${eventId}`
    const tenantId = tenants[0]?.tenant_id
    if (!tenantId) return Response.json({ sections: [] })
    await requireTenantPermission(tenantId, 'VIEW')
    const sections = await database()`
      select section.id, section.name,
        count(seat.id)::integer as capacity,
        count(seat.id) filter (where seat.status = 'SOLD')::integer as sold,
        count(seat.id) filter (where seat.status = 'HELD')::integer as held,
        count(seat.id) filter (where seat.status = 'AVAILABLE')::integer as available
      from ticketing.venue_sections section
      join ticketing.venue_seats venue_seat on venue_seat.tenant_id = section.tenant_id and venue_seat.section_id = section.id
      join ticketing.event_seats seat on seat.tenant_id = venue_seat.tenant_id and seat.venue_seat_id = venue_seat.id
      where seat.event_id = ${eventId}
      group by section.id, section.name, section.sort_order order by section.sort_order
    `
    return Response.json({ eventId, sections }, { headers: { 'cache-control': 'private, no-store' } })
  } catch (error) { return apiError(error, request) }
}
