import { describe, expect, it } from 'vitest'
import { ZodError } from 'zod'
import { parseWebConfig } from './index'

const requiredWebEnvironment: NodeJS.ProcessEnv = {
  NODE_ENV: 'test',
  NEXT_PUBLIC_SUPABASE_URL: 'https://example.supabase.co',
  NEXT_PUBLIC_SUPABASE_ANON_KEY: 'test-anon-key',
}

describe('parseWebConfig', () => {
  it('fails fast when DATABASE_URL is missing', () => {
    expect(() => parseWebConfig(requiredWebEnvironment)).toThrow(ZodError)
  })

  it('accepts an explicitly configured DATABASE_URL', () => {
    const config = parseWebConfig({
      ...requiredWebEnvironment,
      DATABASE_URL: 'postgresql://postgres:secret@127.0.0.1:5432/war_ticket',
    })

    expect(config.DATABASE_URL).toBe(
      'postgresql://postgres:secret@127.0.0.1:5432/war_ticket',
    )
  })
})
