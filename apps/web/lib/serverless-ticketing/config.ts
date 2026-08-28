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
})

export function parseEdgeRedisEnvironment(environment: NodeJS.ProcessEnv) {
  return redisEnvironmentSchema.parse(environment)
}

export function parseEdgeQueueEnvironment(environment: NodeJS.ProcessEnv) {
  return queueEnvironmentSchema.parse(environment)
}

export function parseEdgeCronEnvironment(environment: NodeJS.ProcessEnv) {
  return cronEnvironmentSchema.parse(environment)
}

export function parseEdgePaymentEnvironment(environment: NodeJS.ProcessEnv) {
  return paymentEnvironmentSchema.parse(environment)
}
