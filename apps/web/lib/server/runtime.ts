import { parseWebConfig, type WebConfig } from '@war-ticket/config'
import {
  CheckoutRepository,
  CatalogRepository,
  createDatabaseClient,
  EdgeCheckoutRepository,
  EnvelopeCipher,
  InventoryRepository,
  PaymentRepository,
  type DatabaseClient,
} from '@war-ticket/database'
import { createLogger } from '@war-ticket/observability'
import { createRedisClient, QueueService, type RedisClient } from '@war-ticket/redis'
import { ServerlessCheckoutService } from '@/lib/serverless-ticketing/service'
import { edgeRedis } from '@/lib/serverless-ticketing/redis'

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
  state.database ??= createDatabaseClient(config().DATABASE_URL)
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

export function checkoutRepository(): CheckoutRepository {
  return new CheckoutRepository(database(), cipher())
}

export function paymentRepository(): PaymentRepository {
  return new PaymentRepository(database(), cipher())
}

export function edgeCheckoutRepository(): EdgeCheckoutRepository {
  return new EdgeCheckoutRepository(database())
}

export function serverlessCheckoutService(): ServerlessCheckoutService {
  return new ServerlessCheckoutService(edgeRedis(), edgeCheckoutRepository())
}
