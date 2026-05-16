'use client'

import type { ReactNode } from 'react'
import { SessionProvider as NextAuthSessionProvider } from 'next-auth/react'
import type { Session } from 'next-auth'

interface SessionProviderProps {
  children: ReactNode
  session?: Session | null | undefined
}

export function SessionProvider({ children, session = null }: SessionProviderProps) {
  return <NextAuthSessionProvider session={session}>{children}</NextAuthSessionProvider>
}
