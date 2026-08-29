import { z } from 'zod'
import { uuidSchema } from '@war-ticket/contracts'
import { apiError, assertSameOrigin, parseJson, requireUser } from '@/lib/server/api'
import { database } from '@/lib/server/runtime'

const schema = z.object({ channels: z.array(z.enum(['EMAIL','WHATSAPP'])).min(1).max(2) })
interface RouteContext { readonly params: Promise<{ eventId: string }> }
export async function POST(request: Request, context: RouteContext): Promise<Response> { try { assertSameOrigin(request); const user = await requireUser(); const eventId = uuidSchema.parse((await context.params).eventId); const input = await parseJson(request, schema); await database()`insert into public.event_subscriptions (user_id, event_id, channels) values (${user.id}, ${eventId}, ${input.channels}) on conflict (user_id,event_id) do update set channels = excluded.channels`; return Response.json({ subscribed: true }) } catch (error) { return apiError(error, request) } }
export async function DELETE(request: Request, context: RouteContext): Promise<Response> { try { assertSameOrigin(request); const user = await requireUser(); const eventId = uuidSchema.parse((await context.params).eventId); await database()`delete from public.event_subscriptions where user_id = ${user.id} and event_id = ${eventId}`; return Response.json({ subscribed: false }) } catch (error) { return apiError(error, request) } }
