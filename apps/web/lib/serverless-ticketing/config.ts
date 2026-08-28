import { z } from 'zod'

const redisEnvironmentSchema = z.object({
  UPSTASH_REDIS_REST_URL: z.string().url(),
  UPSTASH_REDIS_REST_TOKEN: z.string().min(1),
})

const queueEnvironmentSchema = redisEnvironmentSchema.extend({
  CONCURRENT_CHECKOUT_CAPACITY: z.coerce.number().int().min(1).max(10_000).default(100),
  ADMISSION_TTL_SECONDS: z.coerce.number().int().min(30).max(600).default(120),
  HOLD_TTL_SECONDS: z.coerce.number().int().min(60).max(1_800).default(600),
  IDEMPOTENCY_TTL_SECONDS: z.coerce.number().int().min(60).max(172_800).default(86_400),
})

const cronEnvironmentSchema = z.object({
  CRON_SECRET: z.string().min(16),
})

const paymentEnvironmentSchema = z.object({
  MIDTRANS_MERCHANT_ID: z.string().min(1),
  MIDTRANS_SERVER_KEY: z.string().min(1),
  MIDTRANS_ENVIRONMENT: z.enum(['SANDBOX', 'PRODUCTION']).default('SANDBOX'),
})

type Environment = Readonly<Record<string, string | undefined>>

function normalizeEdgeRedisEnvironment(environment: Environment): Environment {
  return {
    ...environment,
    UPSTASH_REDIS_REST_URL:
      environment.UPSTASH_REDIS_REST_URL ?? environment.KV_REST_API_URL,
    UPSTASH_REDIS_REST_TOKEN:
      environment.UPSTASH_REDIS_REST_TOKEN ?? environment.KV_REST_API_TOKEN,
  }
}

export function parseEdgeRedisEnvironment(environment: Environment) {
  return redisEnvironmentSchema.parse(normalizeEdgeRedisEnvironment(environment))
}

export function parseEdgeQueueEnvironment(environment: Environment) {
  return queueEnvironmentSchema.parse(normalizeEdgeRedisEnvironment(environment))
}

export function parseEdgeCronEnvironment(environment: Environment) {
  return cronEnvironmentSchema.parse(environment)
}

export function parseEdgePaymentEnvironment(environment: Environment) {
  return paymentEnvironmentSchema.parse(environment)
}
