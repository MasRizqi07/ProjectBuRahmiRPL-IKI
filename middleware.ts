import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const PROTECTED_ADMIN = ['/admin']
const PROTECTED_USER = ['/my-tickets', '/payment', '/order-confirmation']
const AUTH_ONLY = ['/login', '/register']

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  const token =
    request.cookies.get('next-auth.session-token')?.value ??
    request.cookies.get('__Secure-next-auth.session-token')?.value

  const isAuth = Boolean(token)
  const isAdminRoute = PROTECTED_ADMIN.some((route) => pathname.startsWith(route))
  const isUserRoute = PROTECTED_USER.some((route) => pathname.startsWith(route))
  const isAuthRoute = AUTH_ONLY.includes(pathname)

  if ((isAdminRoute || isUserRoute) && !isAuth) {
    const url = new URL('/login', request.url)
    url.searchParams.set('callbackUrl', encodeURIComponent(pathname))
    return NextResponse.redirect(url)
  }

  if (isAuthRoute && isAuth) {
    return NextResponse.redirect(new URL('/', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/admin/:path*',
    '/my-tickets/:path*',
    '/payment/:path*',
    '/order-confirmation/:path*',
    '/login',
    '/register',
  ],
}
