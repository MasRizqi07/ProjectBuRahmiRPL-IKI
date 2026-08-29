import { redirect } from 'next/navigation'
import { requirePlatformRole } from '@/lib/auth/authorization'
import { isSupabaseConfigured } from '@/lib/supabase/config'

export default async function AdminLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  if (isSupabaseConfigured()) {
    try {
      await requirePlatformRole(['PLATFORM_ADMIN'])
    } catch {
      redirect('/forbidden')
    }
  }
  return children
}
