import type { User } from '@supabase/supabase-js'
import { DomainError } from '@war-ticket/domain'
import { createClient } from '@/lib/supabase/server'
import { isSupabaseConfigured } from '@/lib/supabase/config'
import { hasTenantPermission, isPlatformRole, platformRoles } from './roles'
import type { PlatformRole, TenantPermission, TenantRole } from './roles'

export { hasTenantPermission, platformRoles, tenantRoles } from './roles'
export type { PlatformRole, TenantPermission, TenantRole } from './roles'

export interface Viewer {
  readonly id: string
  readonly email: string | null
  readonly name: string | null
  readonly platformRole: PlatformRole
}

export function viewerFromUser(user: User): Viewer {
  const role: unknown = user.app_metadata.platform_role
  const name: unknown = user.user_metadata.full_name
  return {
    id: user.id,
    email: user.email ?? null,
    name: typeof name === 'string' && name.trim().length > 0 ? name : null,
    platformRole: isPlatformRole(role) ? role : 'BUYER',
  }
}

export async function requirePlatformRole(allowed: readonly PlatformRole[]): Promise<Viewer> {
  if (!isSupabaseConfigured()) {
    throw new DomainError('SERVICE_UNAVAILABLE', 'Authentication service is not configured')
  }
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) throw new DomainError('UNAUTHORIZED', 'Authentication is required')

  const profile = await supabase.from('profiles').select('role').eq('id', user.id).maybeSingle()
  if (profile.error) throw new DomainError('INTERNAL_ERROR', 'Unable to verify platform role', { cause: profile.error })
  const persistedRole = profile.data?.role === 'platform_admin'
    ? 'PLATFORM_ADMIN'
    : profile.data?.role === 'support' ? 'SUPPORT' : 'BUYER'
  const viewer = { ...viewerFromUser(user), platformRole: persistedRole } satisfies Viewer
  if (!allowed.includes(viewer.platformRole)) {
    throw new DomainError('FORBIDDEN', 'Your account is not authorized for this operation')
  }
  return viewer
}

export async function requireTenantPermission(tenantId: string, permission: TenantPermission): Promise<Viewer & { readonly tenantRole: TenantRole }> {
  const viewer = await requirePlatformRole(platformRoles)
  if (viewer.platformRole === 'PLATFORM_ADMIN') return { ...viewer, tenantRole: 'OWNER' }
  const supabase = await createClient()
  const { data, error } = await supabase
    .schema('ticketing')
    .from('tenant_memberships')
    .select('role')
    .eq('tenant_id', tenantId)
    .eq('user_id', viewer.id)
    .maybeSingle()

  if (error) throw new DomainError('INTERNAL_ERROR', 'Unable to verify organizer membership', { cause: error })
  if (!data || !hasTenantPermission(data.role, permission)) {
    throw new DomainError('FORBIDDEN', 'Insufficient organizer permissions')
  }
  return { ...viewer, tenantRole: data.role }
}

export async function requireAnyTenantRole(): Promise<Viewer & { readonly tenantId: string; readonly tenantRole: TenantRole }> {
  const viewer = await requirePlatformRole(platformRoles)
  if (viewer.platformRole === 'PLATFORM_ADMIN') {
    return { ...viewer, tenantId: '*', tenantRole: 'OWNER' }
  }
  const supabase = await createClient()
  const { data, error } = await supabase
    .schema('ticketing')
    .from('tenant_memberships')
    .select('tenant_id, role')
    .eq('user_id', viewer.id)
    .limit(1)
    .maybeSingle()
  if (error) throw new DomainError('INTERNAL_ERROR', 'Unable to verify organizer membership', { cause: error })
  if (!data) throw new DomainError('FORBIDDEN', 'Organizer membership is required')
  return { ...viewer, tenantId: data.tenant_id, tenantRole: data.role }
}
