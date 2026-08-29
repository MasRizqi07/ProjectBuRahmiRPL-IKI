import { z } from 'zod'
import { apiError, assertSameOrigin, parseJson } from '@/lib/server/api'
import { database } from '@/lib/server/runtime'

const newsletterSchema = z.object({ email: z.string().trim().toLowerCase().email().max(254), consent: z.literal(true) })

export async function POST(request: Request): Promise<Response> {
  try {
    assertSameOrigin(request)
    const input = await parseJson(request, newsletterSchema)
    await database()`
      insert into public.newsletter_subscriptions (email, status, consent_at)
      values (${input.email}, 'PENDING', now())
      on conflict (email) do update set status = 'PENDING', consent_at = now()
    `
    return Response.json({ subscribed: true, confirmationRequired: true }, { status: 202 })
  } catch (error) {
    return apiError(error, request)
  }
}
