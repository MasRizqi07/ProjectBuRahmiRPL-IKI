import { describe, expect, it } from 'vitest'
import { tenantRoles, platformRoles } from '../auth/roles'

describe('require-role and membership security invariants', () => {
  it('validates all tenant roles are defined and distinct', () => {
    expect(tenantRoles).toEqual(['OWNER', 'ADMIN', 'OPERATOR', 'FINANCE', 'VIEWER'])
  })

  it('validates platform administrative roles are defined and distinct', () => {
    expect(platformRoles).toEqual(['BUYER', 'SUPPORT', 'PLATFORM_ADMIN'])
  })
})

