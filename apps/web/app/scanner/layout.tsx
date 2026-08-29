import { redirect } from 'next/navigation'
import { requireAnyTenantRole } from '@/lib/auth/authorization'
import { isSupabaseConfigured } from '@/lib/supabase/config'

export default async function ScannerLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  if (isSupabaseConfigured()) {
    try {
      const viewer = await requireAnyTenantRole()
      if (!['OWNER', 'ADMIN', 'OPERATOR'].includes(viewer.tenantRole)) redirect('/forbidden')
    } catch {
      redirect('/forbidden')
    }
  }
  return children
}
