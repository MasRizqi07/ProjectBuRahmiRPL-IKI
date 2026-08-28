import { Ratelimit } from '@upstash/ratelimit'
import type { Redis } from '@upstash/redis'
import { DomainError } from '@war-ticket/domain'
import { edgeRedis } from './redis'

type Operation = 'join' | 'status' | 'reserve'

interface Limiters {
  readonly join: Ratelimit
  readonly status: Ratelimit
  readonly reserve: Ratelimit
}

let limiters: Limiters | undefined

function createLimiters(redis: Redis): Limiters {
  return {
    join: new Ratelimit({
      redis,
      prefix: 'wt-edge:ratelimit:join',
      limiter: Ratelimit.slidingWindow(10, '1 m'),
      analytics: false,
      timeout: 1_500,
    }),
    status: new Ratelimit({
      redis,
      prefix: 'wt-edge:ratelimit:status',
      limiter: Ratelimit.slidingWindow(30, '1 m'),
      analytics: false,
      timeout: 1_500,
    }),
    reserve: new Ratelimit({
      redis,
      prefix: 'wt-edge:ratelimit:reserve',
      limiter: Ratelimit.slidingWindow(10, '1 m'),
      analytics: false,
      timeout: 1_500,
    }),
  }
}

function requestIp(request: Request): string {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip')?.trim() ||
    'unknown'
  )
}

export async function enforceRateLimit(input: {
  operation: Operation
  eventId: string
  userId: string
  request: Request
}): Promise<void> {
  limiters ??= createLimiters(edgeRedis())
  const limiter = limiters[input.operation]
  const [user, ip] = await Promise.all([
    limiter.limit(`user:${input.eventId}:${input.userId}`),
    limiter.limit(`ip:${input.eventId}:${requestIp(input.request)}`),
  ])
  await Promise.allSettled([user.pending, ip.pending])
  if (!user.success || !ip.success || user.reason === 'timeout' || ip.reason === 'timeout') {
    throw new DomainError('RATE_LIMITED', 'Too many requests', {
      retryable: true,
      details: { retryAfterMs: Math.max(user.reset, ip.reset) - Date.now() },
    })
  }
}
