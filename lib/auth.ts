import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import { z } from 'zod'
import type { NextAuthConfig } from 'next-auth'

const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
})

const DEV_USERS = [
  {
    id: '1',
    name: 'Admin War Ticket',
    email: 'admin@warticket.id',
    password: 'admin123',
    role: 'admin' as const,
  },
  {
    id: '2',
    name: 'User Demo',
    email: 'user@warticket.id',
    password: 'user123',
    role: 'user' as const,
  },
]

export const authConfig: NextAuthConfig = {
  providers: [
    Credentials({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        const parsed = credentialsSchema.safeParse(credentials)

        if (!parsed.success) {
          return null
        }

        const user = DEV_USERS.find(
          (u) => u.email === parsed.data.email && u.password === parsed.data.password,
        )

        if (!user) {
          return null
        }

        const { password, ...userWithoutPassword } = user
        return userWithoutPassword
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.id = (user as { id: string }).id
        token.role = (user as { role?: string }).role
      }
      return token
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string
        ;(session.user as { role?: string }).role = token.role as string
      }
      return session
    },
  },
  pages: {
    signIn: '/login',
    error: '/login',
  },
  session: {
    strategy: 'jwt',
  },
  secret: process.env.NEXTAUTH_SECRET || 'development-secret',
}

export const { handlers, auth, signIn, signOut } = NextAuth(authConfig)
