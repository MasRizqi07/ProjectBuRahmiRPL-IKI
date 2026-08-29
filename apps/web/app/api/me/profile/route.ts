import { z } from 'zod'
import { apiError, assertSameOrigin, parseJson, requireUser } from '@/lib/server/api'
import { createClient } from '@/lib/supabase/server'

const updateProfileSchema = z.object({
  fullName: z.string().trim().min(2).max(100),
  phone: z.string().trim().regex(/^\+?[1-9]\d{7,14}$/),
  emailNotifications: z.boolean(),
  whatsappNotifications: z.boolean(),
})

export async function GET(request: Request): Promise<Response> {
  try {
    const user = await requireUser()
    const supabase = await createClient()
    const [auth, profile] = await Promise.all([
      supabase.auth.getUser(),
      supabase.from('profiles').select('full_name, phone, email_notifications, whatsapp_notifications').eq('id', user.id).single(),
    ])
    if (auth.error) throw auth.error
    if (profile.error) throw profile.error
    return Response.json({
      email: auth.data.user.email ?? '',
      fullName: profile.data.full_name ?? '',
      phone: profile.data.phone ?? '',
      emailNotifications: profile.data.email_notifications,
      whatsappNotifications: profile.data.whatsapp_notifications,
    }, { headers: { 'cache-control': 'private, no-store' } })
  } catch (error) {
    return apiError(error, request)
  }
}

export async function PATCH(request: Request): Promise<Response> {
  try {
    assertSameOrigin(request)
    const user = await requireUser()
    const input = await parseJson(request, updateProfileSchema)
    const supabase = await createClient()
    const { error } = await supabase.from('profiles').update({
      full_name: input.fullName,
      phone: input.phone,
      email_notifications: input.emailNotifications,
      whatsapp_notifications: input.whatsappNotifications,
    }).eq('id', user.id)
    if (error) throw error
    return Response.json({ updated: true })
  } catch (error) {
    return apiError(error, request)
  }
}
