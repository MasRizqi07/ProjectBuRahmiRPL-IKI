import { apiError } from '@/lib/server/api'
import { database } from '@/lib/server/runtime'

export async function GET(request: Request): Promise<Response> {
  try { const promos = await database()`select code, title, discount_type, discount_value, max_discount, minimum_spend, quota - redeemed as remaining_quota, ends_at from public.promo_campaigns where enabled and starts_at <= now() and ends_at > now() and redeemed < quota order by ends_at limit 50`; return Response.json({ promos }, { headers: { 'cache-control': 'public, max-age=60' } }) }
  catch (error) { return apiError(error, request) }
}
