import { Redis } from '@upstash/redis'
import { parseEdgeRedisEnvironment } from './config'

let client: Redis | undefined

export function edgeRedis(): Redis {
  if (client === undefined) {
    const environment = parseEdgeRedisEnvironment(process.env)
    client = new Redis({
      url: environment.UPSTASH_REDIS_REST_URL,
      token: environment.UPSTASH_REDIS_REST_TOKEN,
    })
  }
  return client
}
