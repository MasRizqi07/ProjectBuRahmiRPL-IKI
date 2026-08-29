import { apiError, requireUser } from '@/lib/server/api'
import { database } from '@/lib/server/runtime'

export async function GET(request: Request): Promise<Response> {
  try {
    const user = await requireUser()
    const membership = await database()<Array<{ tier: 'ELITE' | 'VANGUARD'; ends_at: Date }>>`select tier, ends_at from public.elite_memberships where user_id = ${user.id} and status = 'ACTIVE' and starts_at <= now() and ends_at > now()`
    const member = membership[0]
    if (!member) return Response.json({ membership: null, presales: [] })
    const presales = await database()`select event.id as event_id, event.title, event.starts_at, session.id as sales_session_id, session.pre_queue_opens_at, session.sales_open_at, presale.required_tier, presale.allocation from ticketing.elite_presales presale join ticketing.sales_sessions session on session.id = presale.sales_session_id join ticketing.events event on event.tenant_id = session.tenant_id and event.id = session.event_id where session.sales_close_at > now() and (presale.required_tier = 'ELITE' or ${member.tier} = 'VANGUARD') order by session.sales_open_at`
    return Response.json({ membership: { tier: member.tier, endsAt: member.ends_at.toISOString() }, presales }, { headers: { 'cache-control': 'private, no-store' } })
  } catch (error) { return apiError(error, request) }
}
