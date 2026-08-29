import type { User } from '@supabase/supabase-js'
import { DomainError } from '@war-ticket/domain'
import { createClient } from '@/lib/supabase/server'

export const tenantRoles = ['OWNER', 'ADMIN', 'OPERATOR', 'FINANCE', 'VIEWER'] as const
export type TenantRole = (typeof tenantRoles)[number]

export const platformRoles = ['BUYER', 'SUPPORT', 'PLATFORM_ADMIN'] as const
export type PlatformRole = (typeof platformRoles)[number]

const tenantRoleRank: Readonly<Record<TenantRole, number>> = {
  VIEWER: 0,
  FINANCE: 1,
  OPERATOR: 2,
  ADMIN: 3,
  OWNER: 4,
}

export interface Viewer {
  readonly id: string
  readonly email: string | null
  readonly name: string | null
  readonly platformRole: PlatformRole
}

function isPlatformRole(value: unknown): value is PlatformRole {
  return typeof value === 'string' && platformRoles.includes(value as PlatformRole)
}

export function viewerFromUser(user: User): Viewer {
  const role = user.app_metadata.platform_role
  const name = user.user_metadata.full_name
  return {
    id: user.id,
    email: user.email ?? null,
    name: typeof name === 'string' && name.trim().length > 0 ? name : null,
    platformRole: isPlatformRole(role) ? role : 'BUYER',
  }
}

export function hasMinimumTenantRole(actual: TenantRole, minimum: TenantRole): boolean {
  return tenantRoleRank[actual] >= tenantRoleRank[minimum]
}

export async function requirePlatformRole(allowed: readonly PlatformRole[]): Promise<Viewer> {
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

export async function requireTenantRole(tenantId: string, minimum: TenantRole): Promise<Viewer & { readonly tenantRole: TenantRole }> {
  const viewer = await requirePlatformRole(platformRoles)
  const supabase = await createClient()
  const { data, error } = await supabase
    .schema('ticketing')
    .from('tenant_memberships')
    .select('role')
    .eq('tenant_id', tenantId)
    .eq('user_id', viewer.id)
    .maybeSingle()

  if (error) throw new DomainError('INTERNAL_ERROR', 'Unable to verify organizer membership', { cause: error })
  if (!data || !hasMinimumTenantRole(data.role, minimum)) {
    throw new DomainError('FORBIDDEN', 'Insufficient organizer permissions')
  }
  return { ...viewer, tenantRole: data.role }
}
