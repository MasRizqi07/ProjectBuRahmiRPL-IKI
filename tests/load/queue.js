import http from 'k6/http'
import { check, fail } from 'k6'

const baseUrl = __ENV.BASE_URL ?? 'http://localhost:3000'
const sessionIds = (__ENV.SALES_SESSION_IDS ?? '').split(',').filter(Boolean)
const authCookies = JSON.parse(__ENV.AUTH_COOKIES_JSON ?? '[]')

if (sessionIds.length !== 3) fail('SALES_SESSION_IDS must contain exactly three comma-separated IDs')
if (authCookies.length < 10_000) fail('AUTH_COOKIES_JSON must contain 10,000 unique authenticated cookie strings')

export const options = {
  scenarios: Object.fromEntries(
    sessionIds.map((_, index) => [
      `ticket_drop_${index + 1}`,
      {
        executor: 'per-vu-iterations',
        vus: index === 0 ? 3_334 : 3_333,
        iterations: 1,
        maxDuration: '90s',
        exec: 'joinQueue',
        startTime: '0s',
        env: { SESSION_INDEX: String(index) },
      },
    ]),
  ),
  thresholds: {
    http_req_failed: ['rate<0.01'],
    http_req_duration: ['p(95)<500'],
    checks: ['rate>0.99'],
  },
}

export function joinQueue() {
  const sessionIndex = Number(__ENV.SESSION_INDEX)
  const response = http.post(
    `${baseUrl}/api/v1/sales-sessions/${sessionIds[sessionIndex]}/queue`,
    null,
    {
      headers: { Cookie: authCookies[__VU - 1] },
      tags: { operation: 'queue_join', sales_session: String(sessionIndex + 1) },
    },
  )
  check(response, {
    'queue join is created or idempotently returned': (result) =>
      result.status === 200 || result.status === 201,
  })
}
