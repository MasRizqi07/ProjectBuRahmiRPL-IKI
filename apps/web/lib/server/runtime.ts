import { parseWebConfig, type WebConfig } from '@war-ticket/config'
import {
  CheckoutRepository,
  CatalogRepository,
  createDatabaseClient,
  EnvelopeCipher,
  InventoryRepository,
  PaymentRepository,
  type DatabaseClient,
} from '@war-ticket/database'
import { createLogger } from '@war-ticket/observability'
import { createRedisClient, QueueService, type RedisClient } from '@war-ticket/redis'

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

export function redis(): RedisClient {
  state.redis ??= createRedisClient(config().REDIS_URL)
  return state.redis
}

export function cipher(): EnvelopeCipher {
  state.cipher ??= new EnvelopeCipher(config().CREDENTIAL_ENCRYPTION_KEY)
  return state.cipher
}

export function queueService(): QueueService {
  return new QueueService(redis(), { signingSecret: config().QUEUE_SIGNING_SECRET })
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
