import { timingSafeEqual } from 'node:crypto'
import { apiError } from '@/lib/server/api'
import { edgeRedis } from '@/lib/serverless-ticketing/redis'
import { activeEventsCursorKey, activeEventsKey } from '@/lib/serverless-ticketing/keys'
import { parseEdgeCronEnvironment } from '@/lib/serverless-ticketing/config'
import { serverlessCheckoutService } from '@/lib/server/runtime'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

function authorized(request: Request): boolean {
  const expected = `Bearer ${parseEdgeCronEnvironment(process.env).CRON_SECRET}`
  const actual = request.headers.get('authorization') ?? ''
  const actualBytes = Buffer.from(actual)
  const expectedBytes = Buffer.from(expected)
  return (
    actualBytes.length === expectedBytes.length &&
    timingSafeEqual(actualBytes, expectedBytes)
  )
}

export async function GET(request: Request): Promise<Response> {
  try {
    if (!authorized(request)) {
      return Response.json({ error: { code: 'UNAUTHORIZED', message: 'Invalid cron secret' } }, { status: 401 })
    }
    const redis = edgeRedis()
    const cursor = (await redis.get<string>(activeEventsCursorKey)) ?? '0'
    const [nextCursor, members] = await redis.sscan(activeEventsKey, cursor, { count: 100 })
    await redis.set(activeEventsCursorKey, nextCursor)
    const eventIds = members.map(String)
    const results = []
    for (let offset = 0; offset < eventIds.length; offset += 10) {
      const batch = eventIds.slice(offset, offset + 10)
      results.push(
        ...(await Promise.all(
          batch.map(async (eventId) => ({
            eventId,
            ...(await serverlessCheckoutService().sweepEvent(eventId)),
          })),
        )),
      )
    }
    return Response.json({ processedEvents: results.length, results }, {
      headers: { 'cache-control': 'no-store' },
    })
  } catch (error) {
    return apiError(error, request)
  }
}
