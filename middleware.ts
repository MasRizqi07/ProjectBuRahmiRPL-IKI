import { auth } from '@/lib/auth'
import { NextResponse } from 'next/server'

export default auth((req) => {
  const token = req.auth
  const isAdminRoute = req.nextUrl.pathname.startsWith('/admin')
  const userRole = (token?.user as { role?: string })?.role
  
  if (isAdminRoute && userRole !== 'admin') {
    return NextResponse.redirect(new URL('/login?callbackUrl=/admin', req.url))
  }
  
  if (!token && (isAdminRoute || req.nextUrl.pathname.startsWith('/my-tickets') || req.nextUrl.pathname.startsWith('/payment') || req.nextUrl.pathname.startsWith('/order-confirmation'))) {
    return NextResponse.redirect(new URL('/login', req.url))
  }

  return NextResponse.next()
})

export const config = {
  matcher: ['/admin/:path*', '/my-tickets/:path*', '/payment/:path*', '/order-confirmation/:path*']
}
