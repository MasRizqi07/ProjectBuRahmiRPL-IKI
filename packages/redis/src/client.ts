import Redis from 'ioredis'

export type RedisClient = Redis

export function createRedisClient(redisUrl: string): RedisClient {
  return new Redis(redisUrl, {
    enableReadyCheck: true,
    lazyConnect: true,
    maxRetriesPerRequest: 2,
    retryStrategy(attempt) {
      return Math.min(attempt * 100, 2_000)
    },
  })
}
