export const tenantRoles = ['OWNER', 'ADMIN', 'OPERATOR', 'FINANCE', 'VIEWER'] as const
export type TenantRole = (typeof tenantRoles)[number]

export const platformRoles = ['BUYER', 'SUPPORT', 'PLATFORM_ADMIN'] as const
export type PlatformRole = (typeof platformRoles)[number]

export type TenantPermission = 'VIEW' | 'OPERATE' | 'FINANCE' | 'ADMIN' | 'OWN'
const permissions: Readonly<Record<TenantRole, readonly TenantPermission[]>> = {
  OWNER: ['VIEW', 'OPERATE', 'FINANCE', 'ADMIN', 'OWN'],
  ADMIN: ['VIEW', 'OPERATE', 'FINANCE', 'ADMIN'],
  OPERATOR: ['VIEW', 'OPERATE'],
  FINANCE: ['VIEW', 'FINANCE'],
  VIEWER: ['VIEW'],
}

export function hasTenantPermission(role: TenantRole, permission: TenantPermission): boolean {
  return permissions[role].includes(permission)
}

export function isPlatformRole(value: unknown): value is PlatformRole {
  return typeof value === 'string' && platformRoles.includes(value as PlatformRole)
}
