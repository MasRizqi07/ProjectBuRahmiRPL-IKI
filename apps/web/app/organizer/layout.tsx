import { redirect } from 'next/navigation'
import { requireAnyTenantRole } from '@/lib/auth/authorization'
import { isSupabaseConfigured } from '@/lib/supabase/config'

export default async function OrganizerLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  if (isSupabaseConfigured()) {
    try {
      await requireAnyTenantRole()
    } catch {
      redirect('/forbidden')
    }
  }
  return children
}
