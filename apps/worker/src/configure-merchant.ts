import { z } from 'zod'
import { parseSharedConfig } from '@war-ticket/config'
import {
  createDatabaseClient,
  EnvelopeCipher,
  MerchantConfigRepository,
} from '@war-ticket/database'

const inputSchema = z.object({
  TENANT_ID: z.string().uuid(),
  MIDTRANS_ENVIRONMENT: z.enum(['SANDBOX', 'PRODUCTION']).default('SANDBOX'),
  MIDTRANS_MERCHANT_ID: z.string().min(1),
  MIDTRANS_CLIENT_KEY: z.string().min(1),
  MIDTRANS_SERVER_KEY: z.string().min(1),
  MIDTRANS_ENABLED: z.enum(['true', 'false']).default('false'),
  ACTOR_USER_ID: z.string().uuid().optional(),
})

const shared = parseSharedConfig(process.env)
const input = inputSchema.parse(process.env)
const database = createDatabaseClient(shared.DATABASE_URL)

try {
  const repository = new MerchantConfigRepository(
    database,
    new EnvelopeCipher(shared.CREDENTIAL_ENCRYPTION_KEY),
  )
  await repository.configureMidtrans({
    tenantId: input.TENANT_ID,
    environment: input.MIDTRANS_ENVIRONMENT,
    merchantId: input.MIDTRANS_MERCHANT_ID,
    clientKey: input.MIDTRANS_CLIENT_KEY,
    serverKey: input.MIDTRANS_SERVER_KEY,
    enabled: input.MIDTRANS_ENABLED === 'true',
    ...(input.ACTOR_USER_ID === undefined ? {} : { actorUserId: input.ACTOR_USER_ID }),
  })
  process.stdout.write(
    `Midtrans ${input.MIDTRANS_ENVIRONMENT} configuration stored for tenant ${input.TENANT_ID}; enabled=${input.MIDTRANS_ENABLED}\n`,
  )
} finally {
  await database.end({ timeout: 5 })
}
