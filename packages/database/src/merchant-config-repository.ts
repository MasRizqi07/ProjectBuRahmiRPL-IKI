import { DomainError } from '@war-ticket/domain'
import type { DatabaseClient } from './client'
import type { EnvelopeCipher } from './encryption'

export interface ConfigureMidtransMerchantInput {
  readonly tenantId: string
  readonly environment: 'SANDBOX' | 'PRODUCTION'
  readonly merchantId: string
  readonly clientKey: string
  readonly serverKey: string
  readonly enabled: boolean
  readonly actorUserId?: string
}

export class MerchantConfigRepository {
  constructor(
    private readonly sql: DatabaseClient,
    private readonly cipher: EnvelopeCipher,
  ) {}

  async configureMidtrans(input: ConfigureMidtransMerchantInput): Promise<void> {
    await this.sql.begin(async (transaction) => {
      const tenants = await transaction<{ id: string }[]>`
        select id from ticketing.tenants where id = ${input.tenantId} for update
      `
      if (tenants.length !== 1) throw new DomainError('NOT_FOUND', 'Tenant was not found')

      await transaction`
        insert into ticketing.merchant_configs (
          tenant_id, provider, environment, merchant_id, encrypted_server_key,
          client_key, key_version, enabled
        ) values (
          ${input.tenantId}, 'MIDTRANS', ${input.environment}, ${input.merchantId},
          ${this.cipher.encrypt(input.serverKey)}, ${input.clientKey}, 1, ${input.enabled}
        )
        on conflict (tenant_id) do update set
          provider = excluded.provider,
          environment = excluded.environment,
          merchant_id = excluded.merchant_id,
          encrypted_server_key = excluded.encrypted_server_key,
          client_key = excluded.client_key,
          key_version = ticketing.merchant_configs.key_version + 1,
          enabled = excluded.enabled,
          updated_at = now()
      `

      await transaction`
        insert into ticketing.audit_log (
          tenant_id, actor_user_id, action, aggregate_type, aggregate_id, metadata
        ) values (
          ${input.tenantId}, ${input.actorUserId ?? null}, 'merchant_config.updated',
          'tenant', ${input.tenantId},
          ${JSON.stringify({
            provider: 'MIDTRANS',
            environment: input.environment,
            merchantId: input.merchantId,
            enabled: input.enabled,
          })}::jsonb
        )
      `
    })
  }
}
