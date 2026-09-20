import { parseWebConfig, type WebConfig } from '@war-ticket/config'
import {
  CheckoutRepository,
  CatalogRepository,
  BuyerRepository,
  createDatabaseClient,
  EdgeCheckoutRepository,
  EnvelopeCipher,
  InventoryRepository,
  PaymentRepository,
  TenantMembershipRepository,
  type DatabaseClient,
  type EdgeSupabaseClient,
} from '@war-ticket/database'
import { createLogger } from '@war-ticket/observability'
import { createRedisClient, QueueService, type RedisClient } from '@war-ticket/redis'
import { ServerlessCheckoutService } from '@/lib/serverless-ticketing/service'
import { edgeRedis } from '@/lib/serverless-ticketing/redis'
import { CanonicalCheckoutGateway, type CheckoutGateway } from '@/lib/checkout/gateway'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'

interface RuntimeState {
  config?: WebConfig
  database?: DatabaseClient
  redis?: RedisClient
  cipher?: EnvelopeCipher
}

const globalRuntime = globalThis as typeof globalThis & {
  __warTicketRuntime?: RuntimeState
}

const state = globalRuntime.__warTicketRuntime ?? {}
globalRuntime.__warTicketRuntime = state

export const logger = createLogger({ service: 'web' })

export function config(): WebConfig {
  state.config ??= parseWebConfig(process.env)
  return state.config
}

export function database(): DatabaseClient {
  const dbUrl = config().DATABASE_URL
  if (!dbUrl) {
    throw new Error(
      'DATABASE_URL is not configured. Direct PostgreSQL connection is required. ' +
      'Please configure DATABASE_URL in .env.local with your Supabase PostgreSQL connection string.'
    )
  }
  state.database ??= createDatabaseClient(dbUrl)
  return state.database
}

function requiredLegacyValue(name: string, value: string | undefined): string {
  if (value === undefined) {
    throw new Error(`${name} is required by the legacy checkout engine`)
  }
  return value
}

export function redis(): RedisClient {
  state.redis ??= createRedisClient(requiredLegacyValue('REDIS_URL', config().REDIS_URL))
  return state.redis
}

export function cipher(): EnvelopeCipher {
  state.cipher ??= new EnvelopeCipher(
    requiredLegacyValue('CREDENTIAL_ENCRYPTION_KEY', config().CREDENTIAL_ENCRYPTION_KEY),
  )
  return state.cipher
}

export function queueService(): QueueService {
  return new QueueService(redis(), {
    signingSecret: requiredLegacyValue('QUEUE_SIGNING_SECRET', config().QUEUE_SIGNING_SECRET),
  })
}

export function inventoryRepository(): InventoryRepository {
  return new InventoryRepository(database())
}

export function catalogRepository(): CatalogRepository {
  return new CatalogRepository(database())
}

export function buyerRepository(): BuyerRepository {
  return new BuyerRepository(database())
}

export function checkoutRepository(): CheckoutRepository {
  return new CheckoutRepository(database(), cipher())
}

export function paymentRepository(): PaymentRepository {
  return new PaymentRepository(database(), cipher())
}

export function edgeCheckoutRepository(): EdgeCheckoutRepository {
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  const fallback = url && key
    ? createSupabaseClient(url, key) as unknown as EdgeSupabaseClient
    : undefined
  const dbClient = config().DATABASE_URL ? database() : undefined
  return new EdgeCheckoutRepository(dbClient, fallback, edgeRedis())
}

export function serverlessCheckoutService(): ServerlessCheckoutService {
  return new ServerlessCheckoutService(edgeRedis(), edgeCheckoutRepository())
}

export function checkoutGateway(): CheckoutGateway {
  return new CanonicalCheckoutGateway(
    catalogRepository(),
    inventoryRepository(),
    checkoutRepository(),
    paymentRepository(),
    queueService(),
  )
}

export function tenantMembershipRepository(): TenantMembershipRepository {
  return new TenantMembershipRepository(database())
}
