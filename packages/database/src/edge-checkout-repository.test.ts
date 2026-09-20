import { afterEach, describe, expect, it, vi } from 'vitest'
import type { DatabaseClient } from './client'
import {
  EdgeCheckoutRepository,
  type EdgeHoldOrder,
  type EdgeOrderCache,
  type EdgeSupabaseClient,
} from './edge-checkout-repository'

const order: EdgeHoldOrder = {
  id: '10000000-0000-4000-8000-000000000001',
  userId: '10000000-0000-4000-8000-000000000002',
  eventId: '10000000-0000-4000-8000-000000000003',
  tierId: '10000000-0000-4000-8000-000000000004',
  idempotencyKey: 'edge-hold-test',
  requestHash: 'request-hash',
  providerOrderId: 'WT-EDGE-10000000000040008000000000000001',
  quantity: 1,
  unitPrice: 350_000,
  amount: 350_000,
  holdExpiresAt: new Date('2026-09-20T12:00:00.000Z'),
}

function cache(): EdgeOrderCache {
  return {
    get: vi.fn(),
    set: vi.fn().mockResolvedValue('OK'),
  }
}

function fallback(result: { error: null | { message: string } }) {
  const upsert = vi.fn().mockResolvedValue(result)
  return {
    client: {
      schema: vi.fn(() => ({
        from: vi.fn(() => ({ upsert })),
      })),
    } as unknown as EdgeSupabaseClient,
    upsert,
  }
}

afterEach(() => {
  vi.restoreAllMocks()
})

describe('EdgeCheckoutRepository.upsertHoldOrder', () => {
  it('throws and emits a structured error when the Supabase fallback fails', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined)
    const supabase = fallback({ error: { message: 'ticketing schema unavailable' } })
    const redisSet = vi.fn(() => Promise.resolve('OK'))
    const redis: EdgeOrderCache = {
      get: () => Promise.resolve(null),
      set: redisSet,
    }
    const repository = new EdgeCheckoutRepository(undefined, supabase.client, redis)

    await expect(repository.upsertHoldOrder(order)).rejects.toThrow(
      'DATABASE_URL is not configured and Supabase fallback failed',
    )
    expect(redisSet).toHaveBeenCalledOnce()
    expect(supabase.upsert).toHaveBeenCalledOnce()
    expect(consoleError).toHaveBeenCalledWith(expect.stringContaining('edge_order_persistence_failed'))
  })

  it('warns when primary SQL fails but the Supabase fallback persists the order', async () => {
    const consoleWarn = vi.spyOn(console, 'warn').mockImplementation(() => undefined)
    const sql = {
      begin: vi.fn().mockRejectedValue(new Error('primary SQL unavailable')),
    } as unknown as DatabaseClient
    const supabase = fallback({ error: null })
    const repository = new EdgeCheckoutRepository(sql, supabase.client, cache())

    await expect(repository.upsertHoldOrder(order)).resolves.toBeUndefined()
    expect(supabase.upsert).toHaveBeenCalledOnce()
    expect(consoleWarn).toHaveBeenCalledWith(
      expect.stringContaining('edge_order_primary_persistence_failed_fallback_succeeded'),
    )
  })

  it('throws and emits a structured error when both write paths fail', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined)
    const sql = {
      begin: vi.fn().mockRejectedValue(new Error('primary SQL unavailable')),
    } as unknown as DatabaseClient
    const supabase = fallback({ error: { message: 'fallback unavailable' } })
    const repository = new EdgeCheckoutRepository(sql, supabase.client, cache())

    await expect(repository.upsertHoldOrder(order)).rejects.toThrow(
      'primary SQL (primary SQL unavailable) and Supabase fallback (fallback unavailable)',
    )
    expect(supabase.upsert).toHaveBeenCalledOnce()
    expect(consoleError).toHaveBeenCalledWith(expect.stringContaining('edge_order_persistence_failed'))
  })
})
