import http from 'k6/http'
import { check, fail, sleep } from 'k6'
import { Counter } from 'k6/metrics'

const baseUrl = __ENV.BASE_URL ?? 'http://localhost:3000'
const eventId = __ENV.EVENT_ID
const tierId = __ENV.TIER_ID
const appOrigin = __ENV.APP_ORIGIN ?? baseUrl
const vercelBypassSecret = __ENV.VERCEL_BYPASS_SECRET
let rawFixture
try {
  rawFixture = open('../../scripts/load-test/fixture-env.json')
} catch {
  try {
    rawFixture = open('./scripts/load-test/fixture-env.json')
  } catch {
    rawFixture = '{}'
  }
}
let rawCookies = __ENV.AUTH_COOKIES_JSON
if (!rawCookies) {
  try {
    rawCookies = open('../../scripts/load-test/cookies.json')
  } catch {
    try {
      rawCookies = open('./scripts/load-test/cookies.json')
    } catch {
      rawCookies = '[]'
    }
  }
}

const fixture = JSON.parse(rawFixture)
const authCookies = JSON.parse(rawCookies)
const targetVus = parseInt(__ENV.VUS ?? `${Math.max(authCookies.length, 1)}`, 10)

if (!eventId || !tierId) fail('EVENT_ID and TIER_ID are required')
if (authCookies.length === 0) fail('No authenticated cookies loaded')
if (!Number.isSafeInteger(fixture.capacity) || fixture.capacity <= 0) {
  fail('scripts/load-test/fixture-env.json must contain a positive integer capacity')
}
if (!Number.isSafeInteger(targetVus) || targetVus <= 0) fail('VUS must be a positive integer')
if (authCookies.length < targetVus) {
  fail(`VUS=${targetVus} requires at least ${targetVus} authenticated cookies; loaded ${authCookies.length}`)
}

const gate2MinimumVus = fixture.capacity * 10
if (targetVus < gate2MinimumVus) {
  console.warn('!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!')
  console.warn(
    `SMOKE TEST ONLY: VUS=${targetVus} is below the Gate 2 minimum of ${gate2MinimumVus} ` +
      `(10x fixture capacity ${fixture.capacity}). This run MUST NOT be reported as Gate 2 PASSED.`,
  )
  console.warn('!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!')
}

const holdsCreated = new Counter('holds_created')
const soldOut = new Counter('sold_out')
const unexpected = new Counter('unexpected_responses')

const expectedHolds = Math.min(targetVus, fixture.capacity)
const expectedSoldOut = Math.max(targetVus - fixture.capacity, 0)

export const options = {
  scenarios: {
    atomic_reserve: {
      executor: 'per-vu-iterations',
      vus: targetVus,
      iterations: 1,
      maxDuration: '5m',
    },
  },
  thresholds: {
    holds_created: [`count==${expectedHolds}`],
    sold_out: [`count==${expectedSoldOut}`],
    unexpected_responses: ['count==0'],
    http_req_failed: ['rate<0.01'],
  },
}

function requestParams() {
  const protectionHeaders = vercelBypassSecret
    ? {
        'x-vercel-protection-bypass': vercelBypassSecret,
        'x-vercel-set-bypass-cookie': 'true',
      }
    : {}

  return {
    responseCallback: http.expectedStatuses({ min: 200, max: 299 }, 409),
    headers: {
      ...protectionHeaders,
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
  let status = http.get(`${baseUrl}/api/events/${eventId}/queue-status`, params)
  let state = status.json('state')
  let attempts = 0
  while (state === 'WAITING' && attempts < 10) {
    sleep(0.3)
    status = http.get(`${baseUrl}/api/events/${eventId}/queue-status`, params)
    state = status.json('state')
    attempts++
  }
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
