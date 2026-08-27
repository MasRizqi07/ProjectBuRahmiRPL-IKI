import { z } from 'zod'

const sharedSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  DATABASE_URL: z.string().url(),
  REDIS_URL: z.string().url(),
  QUEUE_SIGNING_SECRET: z.string().min(32),
  CREDENTIAL_ENCRYPTION_KEY: z.string().min(32),
})

const webSchema = sharedSchema.extend({
  NEXT_PUBLIC_APP_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
})

const workerSchema = sharedSchema.extend({
  WORKER_ID: z.string().min(1).default('worker-local'),
  WORKER_POLL_INTERVAL_MS: z.coerce.number().int().min(100).max(60_000).default(1_000),
  OUTBOX_BATCH_SIZE: z.coerce.number().int().min(1).max(500).default(50),
})

export type SharedConfig = z.infer<typeof sharedSchema>
export type WebConfig = z.infer<typeof webSchema>
export type WorkerConfig = z.infer<typeof workerSchema>

export function parseSharedConfig(environment: NodeJS.ProcessEnv): SharedConfig {
  return sharedSchema.parse(environment)
}

export function parseWebConfig(environment: NodeJS.ProcessEnv): WebConfig {
  return webSchema.parse(environment)
}

export function parseWorkerConfig(environment: NodeJS.ProcessEnv): WorkerConfig {
  return workerSchema.parse(environment)
}
