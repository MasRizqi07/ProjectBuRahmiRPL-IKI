import { type NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'
import { isSupabaseConfigured } from '@/lib/supabase/config'

const authenticatedPrefixes = [
  '/checkout',
  '/dashboard',
  '/elite/lounge',
  '/my-tickets',
  '/notifications',
  '/order-confirmation',
  '/payment',
  '/profile',
  '/waiting-room',
] as const

function startsWithAny(pathname: string, prefixes: readonly string[]): boolean {
  return prefixes.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`))
}

export async function proxy(request: NextRequest) {
  const { response, user } = await updateSession(request)

  const { pathname } = request.nextUrl

  if (isSupabaseConfigured()) {
    const needsAuthentication = startsWithAny(pathname, authenticatedPrefixes)
      || pathname.startsWith('/admin')
      || pathname.startsWith('/organizer')
      || pathname.startsWith('/scanner')

    if (needsAuthentication && !user) {
      const url = request.nextUrl.clone()
      url.pathname = '/login'
      url.searchParams.set('callbackUrl', pathname)
      return Response.redirect(url)
    }

    if (user) {
      const platformRole = user.app_metadata.platform_role
      const organizerTenants = user.app_metadata.organizer_tenants
      const hasOrganizerAccess = platformRole === 'PLATFORM_ADMIN'
        || (Array.isArray(organizerTenants) && organizerTenants.length > 0)

      if (pathname.startsWith('/admin') && platformRole !== 'PLATFORM_ADMIN') {
        return Response.redirect(new URL('/forbidden', request.url))
      }
      if ((pathname.startsWith('/organizer') || pathname.startsWith('/scanner')) && !hasOrganizerAccess) {
        return Response.redirect(new URL('/forbidden', request.url))
      }
    }
  }

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
