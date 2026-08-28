import { describe, expect, it } from 'vitest'

import { parseEdgeQueueEnvironment, parseEdgeRedisEnvironment } from './config'

describe('edge Redis environment', () => {
  it('accepts the canonical Upstash REST variables', () => {
    expect(
      parseEdgeRedisEnvironment({
        UPSTASH_REDIS_REST_URL: 'https://canonical.upstash.io',
        UPSTASH_REDIS_REST_TOKEN: 'canonical-token',
      }),
    ).toEqual({
      UPSTASH_REDIS_REST_URL: 'https://canonical.upstash.io',
      UPSTASH_REDIS_REST_TOKEN: 'canonical-token',
    })
  })

  it('normalizes the Vercel Marketplace KV aliases', () => {
    expect(
      parseEdgeQueueEnvironment({
        KV_REST_API_URL: 'https://marketplace.upstash.io',
        KV_REST_API_TOKEN: 'marketplace-token',
      }),
    ).toMatchObject({
      UPSTASH_REDIS_REST_URL: 'https://marketplace.upstash.io',
      UPSTASH_REDIS_REST_TOKEN: 'marketplace-token',
      CONCURRENT_CHECKOUT_CAPACITY: 100,
      ADMISSION_TTL_SECONDS: 120,
      HOLD_TTL_SECONDS: 600,
      IDEMPOTENCY_TTL_SECONDS: 86_400,
    })
  })

  it('prefers explicitly configured canonical variables over aliases', () => {
    expect(
      parseEdgeRedisEnvironment({
        UPSTASH_REDIS_REST_URL: 'https://canonical.upstash.io',
        UPSTASH_REDIS_REST_TOKEN: 'canonical-token',
        KV_REST_API_URL: 'https://marketplace.upstash.io',
        KV_REST_API_TOKEN: 'marketplace-token',
      }),
    ).toEqual({
      UPSTASH_REDIS_REST_URL: 'https://canonical.upstash.io',
      UPSTASH_REDIS_REST_TOKEN: 'canonical-token',
    })
  })
})
