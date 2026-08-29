import { z } from 'zod'
import { apiError, assertSameOrigin, parseJson, requireUser } from '@/lib/server/api'
import { database } from '@/lib/server/runtime'

const applicationSchema = z.object({
  companyName: z.string().trim().min(2).max(160),
  picName: z.string().trim().min(2).max(100),
  email: z.string().email().max(254),
  phone: z.string().trim().min(8).max(32),
  estimatedAttendees: z.coerce.number().int().positive().max(5_000_000),
  eventGenre: z.string().trim().min(2).max(120),
})

export async function POST(request: Request): Promise<Response> {
  try {
    assertSameOrigin(request)
    const user = await requireUser()
    const input = await parseJson(request, applicationSchema)
    const rows = await database()<Array<{ id: string }>>`
      insert into public.organizer_applications (
        applicant_user_id, company_name, pic_name, email, phone, estimated_attendees, event_genre
      ) values (${user.id}, ${input.companyName}, ${input.picName}, ${input.email}, ${input.phone}, ${input.estimatedAttendees}, ${input.eventGenre})
      returning id
    `
    return Response.json({ id: rows[0]!.id, status: 'SUBMITTED' }, { status: 201 })
  } catch (error) { return apiError(error, request) }
}
