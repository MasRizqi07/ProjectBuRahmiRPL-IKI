import { z } from 'zod'
import { DomainError } from '@war-ticket/domain'
import { apiError, assertSameOrigin, parseJson, requireUser } from '@/lib/server/api'
import { database } from '@/lib/server/runtime'

const schema = z.object({ code: z.string().trim().toUpperCase().min(3).max(32), subtotal: z.number().int().positive() })
export async function POST(request: Request): Promise<Response> {
  try {
    assertSameOrigin(request); await requireUser(); const input = await parseJson(request, schema)
    const rows = await database()<Array<{ id: string; title: string; discount_type: 'FIXED' | 'PERCENT'; discount_value: number; max_discount: number | null; minimum_spend: number; quota: number; redeemed: number }>>`
      select id, title, discount_type, discount_value, max_discount, minimum_spend, quota, redeemed from public.promo_campaigns
      where code = ${input.code} and enabled and starts_at <= now() and ends_at > now()
    `
    const promo = rows[0]; if (!promo || promo.redeemed >= promo.quota) throw new DomainError('NOT_FOUND', 'Promo is invalid or quota is exhausted')
    if (input.subtotal < promo.minimum_spend) throw new DomainError('VALIDATION_ERROR', 'Minimum spend has not been met', { details: { minimumSpend: promo.minimum_spend } })
    const raw = promo.discount_type === 'FIXED' ? promo.discount_value : Math.floor(input.subtotal * promo.discount_value / 100)
    const discount = Math.min(raw, promo.max_discount ?? raw, input.subtotal)
    return Response.json({ promoId: promo.id, title: promo.title, code: input.code, discount, totalAfterDiscount: input.subtotal - discount, remainingQuota: promo.quota - promo.redeemed })
  } catch (error) { return apiError(error, request) }
}
