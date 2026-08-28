import http from 'k6/http'
import { check, fail } from 'k6'
import { Counter } from 'k6/metrics'

const baseUrl = __ENV.BASE_URL ?? 'http://localhost:3000'
const eventId = __ENV.EVENT_ID
const tierId = __ENV.TIER_ID
const appOrigin = __ENV.APP_ORIGIN ?? baseUrl
const authCookies = JSON.parse(__ENV.AUTH_COOKIES_JSON ?? '[]')

if (!eventId || !tierId) fail('EVENT_ID and TIER_ID are required')
if (authCookies.length < 10_000) fail('AUTH_COOKIES_JSON must contain 10,000 authenticated cookies')

const holdsCreated = new Counter('holds_created')
const soldOut = new Counter('sold_out')
const unexpected = new Counter('unexpected_responses')

export const options = {
  scenarios: {
    atomic_reserve: {
      executor: 'per-vu-iterations',
      vus: 10_000,
      iterations: 1,
      maxDuration: '3m',
    },
  },
  thresholds: {
    holds_created: ['count==100'],
    sold_out: ['count==9900'],
    unexpected_responses: ['count==0'],
    http_req_failed: ['rate<0.01'],
  },
}

function requestParams() {
  return {
    responseCallback: http.expectedStatuses({ min: 200, max: 299 }, 409),
    headers: {
      Cookie: authCookies[__VU - 1],
      Origin: appOrigin,
      'Content-Type': 'application/json',
      'X-Forwarded-For': `198.18.${Math.floor((__VU - 1) / 250) % 256}.${(__VU - 1) % 250 + 1}`,
    },
  }
}

export default function () {
  const params = requestParams()
  http.post(`${baseUrl}/api/events/${eventId}/join-queue`, null, params)
  const status = http.get(`${baseUrl}/api/events/${eventId}/queue-status`, params)
  if (!check(status, { admitted: (response) => response.status === 200 && response.json('state') === 'ADMITTED' })) {
    unexpected.add(1)
    return
  }

  const response = http.post(
    `${baseUrl}/api/events/${eventId}/reserve`,
    JSON.stringify({ tierId, qty: 1 }),
    {
      ...params,
      headers: {
        ...params.headers,
        'Idempotency-Key': `load-reserve-${String(__VU).padStart(8, '0')}`,
      },
    },
  )
  if (response.status === 201) holdsCreated.add(1)
  else if (response.status === 409 && response.json('error.code') === 'INSUFFICIENT_INVENTORY') soldOut.add(1)
  else if (response.status === 409 && response.json('status') === 'SOLD_OUT') soldOut.add(1)
  else unexpected.add(1)
}
