import { describe, expect, it } from 'vitest'
import { hasTenantPermission, tenantRoles } from './roles'

describe('tenant permission matrix', () => {
  it('lets every organizer role view', () => {
    for (const role of tenantRoles) expect(hasTenantPermission(role, 'VIEW')).toBe(true)
  })

  it('does not let lower roles escalate privileges', () => {
    expect(hasTenantPermission('VIEWER', 'FINANCE')).toBe(false)
    expect(hasTenantPermission('FINANCE', 'OPERATE')).toBe(false)
    expect(hasTenantPermission('OPERATOR', 'FINANCE')).toBe(false)
    expect(hasTenantPermission('ADMIN', 'OWN')).toBe(false)
  })

  it('allows higher roles to perform lower-scope work', () => {
    expect(hasTenantPermission('OWNER', 'OWN')).toBe(true)
    expect(hasTenantPermission('ADMIN', 'OPERATE')).toBe(true)
    expect(hasTenantPermission('ADMIN', 'FINANCE')).toBe(true)
  })
})
