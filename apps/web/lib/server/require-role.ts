import 'server-only'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { isSupabaseConfigured } from '@/lib/supabase/config'
import type { TenantMembership, TenantMembershipRole } from '@war-ticket/database'
import { tenantMembershipRepository } from './runtime'

export interface OrganizerAccessResult {
  readonly user: {
    readonly id: string
    readonly email?: string | null | undefined
    readonly user_metadata?: Record<string, unknown> | undefined
  }
  readonly tenantId: string
  readonly role: TenantMembershipRole
  readonly memberships: readonly TenantMembership[]
}

export interface AdminAccessResult {
  readonly user: {
    readonly id: string
    readonly email?: string | null | undefined
    readonly user_metadata?: Record<string, unknown> | undefined
  }
  readonly role: string
}

export async function requireOrganizerAccess(): Promise<OrganizerAccessResult> {
  if (!isSupabaseConfigured()) {
    // Fallback in unconfigured development environments
    return {
      user: { id: 'dev-organizer-user', email: 'organizer@warticket.id' },
      tenantId: '00000000-0000-0000-0000-000000000001',
      role: 'OWNER',
      memberships: [{ tenantId: '00000000-0000-0000-0000-000000000001', role: 'OWNER' }],
    }
  }

  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user) {
    redirect('/login?callbackUrl=/organizer')
  }

  let memberships: readonly TenantMembership[] = []
  try {
    memberships = await tenantMembershipRepository().getTenantMembershipsForUser(user.id)
  } catch {
    // Fallback query via Supabase SDK if direct DB pool is unavailable
    const { data } = await supabase
      .schema('ticketing')
      .from('tenant_memberships')
      .select('tenant_id, role')
      .eq('user_id', user.id)

    if (data && data.length > 0) {
      memberships = data.map((d: { tenant_id: string; role: string }) => ({
        tenantId: d.tenant_id,
        role: d.role as TenantMembershipRole,
      }))
    }
  }

  const primary = memberships[0]
  if (!primary) {
    redirect('/')
  }

  return {
    user: {
      id: user.id,
      email: user.email ?? null,
      user_metadata: user.user_metadata,
    },
    tenantId: primary.tenantId,
    role: primary.role,
    memberships,
  }
}

export async function requireAdminAccess(): Promise<AdminAccessResult> {
  if (!isSupabaseConfigured()) {
    // Fallback in unconfigured development environments
    return {
      user: { id: 'dev-admin-user', email: 'admin@warticket.id' },
      role: 'platform_admin',
    }
  }

  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user) {
    redirect('/login?callbackUrl=/admin')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle()

  const rawRole = profile?.role as string | undefined

  if (rawRole !== 'platform_admin' && rawRole !== 'admin') {
    redirect('/')
  }

  return {
    user: {
      id: user.id,
      email: user.email ?? null,
      user_metadata: user.user_metadata,
    },
    role: rawRole ?? 'platform_admin',
  }
}
