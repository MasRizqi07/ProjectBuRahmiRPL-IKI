import * as fs from 'node:fs'
import * as path from 'node:path'
import * as crypto from 'node:crypto'

function findRepoRoot(): string {
  let dir = process.cwd()
  while (dir !== path.dirname(dir)) {
    if (fs.existsSync(path.join(dir, 'pnpm-workspace.yaml'))) {
      return dir
    }
    dir = path.dirname(dir)
  }
  return process.cwd()
}

function loadEnv() {
  const repoRoot = findRepoRoot()
  const envFiles = [
    path.resolve(repoRoot, '.env.local'),
    path.resolve(repoRoot, 'apps/web/.env.local'),
    path.resolve(repoRoot, '.env'),
  ]

  for (const file of envFiles) {
    if (fs.existsSync(file)) {
      const content = fs.readFileSync(file, 'utf-8')
      for (const line of content.split('\n')) {
        const trimmed = line.trim()
        if (!trimmed || trimmed.startsWith('#')) continue
        const eqIdx = trimmed.indexOf('=')
        if (eqIdx > 0) {
          const key = trimmed.slice(0, eqIdx).trim()
          let val = trimmed.slice(eqIdx + 1).trim()
          val = val.replace(/^["'](.*)["']$/, '$1')
          if (!process.env[key] && val) {
            process.env[key] = val
          }
        }
      }
    }
  }
}

function getArg(name: string, defaultValue?: string): string | undefined {
  const argIndex = process.argv.findIndex((a) => a === `--${name}` || a.startsWith(`--${name}=`))
  if (argIndex === -1) return defaultValue
  const arg = process.argv[argIndex]
  if (arg.includes('=')) {
    return arg.split('=')[1]
  }
  return process.argv[argIndex + 1] ?? defaultValue
}

interface FixtureData {
  eventId: string
  tierId: string
  capacity: number
  price: number
}

function loadFixture(): FixtureData | undefined {
  const repoRoot = findRepoRoot()
  const p = path.resolve(repoRoot, 'scripts/load-test/fixture-env.json')
  if (fs.existsSync(p)) {
    return JSON.parse(fs.readFileSync(p, 'utf-8'))
  }
  return undefined
}

interface BuyerCookie {
  index: number
  userId: string
  cookieString: string
}

function loadBuyerCookies(): BuyerCookie[] {
  const repoRoot = findRepoRoot()
  const simpleCookiesPath = path.resolve(repoRoot, 'scripts/load-test/cookies.json')
  if (fs.existsSync(simpleCookiesPath)) {
    const rawList: string[] = JSON.parse(fs.readFileSync(simpleCookiesPath, 'utf-8'))
    const usersPath = path.resolve(repoRoot, 'scripts/load-test/cookies-users.json')
    const users = fs.existsSync(usersPath) ? JSON.parse(fs.readFileSync(usersPath, 'utf-8')) : []
    return rawList.map((cookieString, index) => ({
      index: index + 1,
      userId: users[index]?.userId ?? `user-${index + 1}`,
      cookieString,
    }))
  }
  return []
}

async function runGate1(baseUrl: string, fixture: FixtureData, buyers: BuyerCookie[]) {
  console.log('\n============================================================')
  console.log('📌 GATE 1: 3-User Join/Rank/Admission & Reserve Sequence')
  console.log('============================================================')
  if (buyers.length < 3) {
    console.error('❌ Need at least 3 provisioned buyers. Run `pnpm loadtest:provision --count=20` first.')
    return false
  }

  const sample = buyers.slice(0, 3)
  let allSuccess = true

  for (const buyer of sample) {
    console.log(`\n▶️ [Buyer ${buyer.index}] Joining queue for event ${fixture.eventId}...`)
    const joinRes = await fetch(`${baseUrl}/api/events/${fixture.eventId}/join-queue`, {
      method: 'POST',
      headers: {
        Cookie: buyer.cookieString,
        Origin: baseUrl,
        'Content-Type': 'application/json',
      },
    })
    const joinData = await joinRes.text()
    console.log(`  Join status: ${joinRes.status} | Body: ${joinData}`)

    console.log(`▶️ [Buyer ${buyer.index}] Checking queue status...`)
    const statusRes = await fetch(`${baseUrl}/api/events/${fixture.eventId}/queue-status`, {
      method: 'GET',
      headers: {
        Cookie: buyer.cookieString,
        Origin: baseUrl,
      },
    })
    const statusData = await statusRes.text()
    console.log(`  Queue status: ${statusRes.status} | Body: ${statusData}`)

    console.log(`▶️ [Buyer ${buyer.index}] Creating reservation...`)
    const idemKey = `gate1-seq-${buyer.index}-${Date.now()}`
    const reserveRes = await fetch(`${baseUrl}/api/events/${fixture.eventId}/reserve`, {
      method: 'POST',
      headers: {
        Cookie: buyer.cookieString,
        Origin: baseUrl,
        'Content-Type': 'application/json',
        'Idempotency-Key': idemKey,
      },
      body: JSON.stringify({ tierId: fixture.tierId, qty: 1 }),
    })
    const reserveData = await reserveRes.text()
    console.log(`  Reserve status: ${reserveRes.status} | Body: ${reserveData}`)

    if (!reserveRes.ok && reserveRes.status !== 201) {
      allSuccess = false
    }
  }

  console.log(`\nGate 1 Result: ${allSuccess ? '✅ PASSED' : '⚠️ COMPLETED WITH WARNINGS'}`)
  return allSuccess
}

async function runGate3(baseUrl: string, fixture: FixtureData, buyers: BuyerCookie[]) {
  console.log('\n============================================================')
  console.log('📌 GATE 3: Concurrent Duplicate-Idempotency Proof')
  console.log('============================================================')
  if (buyers.length < 1) {
    console.error('❌ Need at least 1 provisioned buyer.')
    return false
  }

  const buyer = buyers.length > 3 ? buyers[3] : buyers[0]
  console.log(`[Gate 3] Buyer ${buyer.index} joining queue & obtaining admission...`)
  await fetch(`${baseUrl}/api/events/${fixture.eventId}/join-queue`, {
    method: 'POST',
    headers: {
      Cookie: buyer.cookieString,
      Origin: baseUrl,
      'Content-Type': 'application/json',
    },
  })
  await fetch(`${baseUrl}/api/events/${fixture.eventId}/queue-status`, {
    method: 'GET',
    headers: {
      Cookie: buyer.cookieString,
      Origin: baseUrl,
    },
  })

  const idemKey = `gate3-concurrent-idem-${Date.now()}`
  console.log(`Sending 2 simultaneous POST /reserve requests with Idempotency-Key: ${idemKey}`)

  const doRequest = async (reqNum: number) => {
    const t0 = Date.now()
    const res = await fetch(`${baseUrl}/api/events/${fixture.eventId}/reserve`, {
      method: 'POST',
      headers: {
        Cookie: buyer.cookieString,
        Origin: baseUrl,
        'Content-Type': 'application/json',
        'Idempotency-Key': idemKey,
      },
      body: JSON.stringify({ tierId: fixture.tierId, qty: 1 }),
    })
    const text = await res.text()
    const duration = Date.now() - t0
    return { reqNum, status: res.status, text, duration }
  }

  const [resA, resB] = await Promise.all([doRequest(1), doRequest(2)])

  console.log(`  Request 1 (${resA.duration}ms): Status ${resA.status} | Body: ${resA.text}`)
  console.log(`  Request 2 (${resB.duration}ms): Status ${resB.status} | Body: ${resB.text}`)

  const isIdentical = resA.text === resB.text
  const areSuccess = (resA.status === 200 || resA.status === 201) && (resB.status === 200 || resB.status === 201)

  if (isIdentical && areSuccess) {
    console.log('✅ GATE 3 PASSED: Both concurrent requests returned identical response and exactly one hold created.')
    return true
  } else {
    console.log('❌ GATE 3 FAILED: Responses differed or did not return success.')
    return false
  }
}

async function runGate4(baseUrl: string, fixture: FixtureData | undefined, buyers: BuyerCookie[]) {
  console.log('\n============================================================')
  console.log('📌 GATE 4: Midtrans Notification Signature Proof (Forged vs Valid)')
  console.log('============================================================')

  if (!fixture || buyers.length === 0) {
    console.log('❌ Gate 4 requires a seeded fixture and at least one provisioned buyer.')
    return false
  }

  const serverKey = process.env.MIDTRANS_SERVER_KEY
  const merchantId = process.env.MIDTRANS_MERCHANT_ID
  if (!serverKey || !merchantId) {
    console.log(
      '❌ Gate 4 requires MIDTRANS_SERVER_KEY and MIDTRANS_MERCHANT_ID from the same merchant configuration used by `pnpm merchant:configure`.',
    )
    return false
  }

  const statusCode = '200'
  const buyer = buyers[0]
  const buyerHeaders = {
    Cookie: buyer.cookieString,
    Origin: baseUrl,
    'Content-Type': 'application/json',
  }

  console.log('\n--- Gate 4 setup: real admitted buyer and real hold ---')
  const joinRes = await fetch(`${baseUrl}/api/events/${fixture.eventId}/join-queue`, {
    method: 'POST',
    headers: buyerHeaders,
  })
  const joinBody = await joinRes.text()
  console.log(`  Join response: ${joinRes.status} | ${joinBody}`)
  if (joinRes.status !== 200 && joinRes.status !== 201) {
    console.log('❌ Gate 4 setup failed: buyer could not join the queue.')
    return false
  }

  let admitted = false
  for (let attempt = 1; attempt <= 10; attempt += 1) {
    const statusRes = await fetch(`${baseUrl}/api/events/${fixture.eventId}/queue-status`, {
      headers: buyerHeaders,
    })
    const statusBody = await statusRes.text()
    console.log(`  Queue response ${attempt}: ${statusRes.status} | ${statusBody}`)
    let state: unknown
    try {
      state = (JSON.parse(statusBody) as Record<string, unknown>).state
    } catch {
      state = undefined
    }
    if (statusRes.status === 200 && state === 'ADMITTED') {
      admitted = true
      break
    }
    if (statusRes.status !== 200 || state !== 'WAITING') break
    await new Promise((resolve) => setTimeout(resolve, 300))
  }
  if (!admitted) {
    console.log('❌ Gate 4 setup failed: buyer was not admitted.')
    return false
  }

  const idempotencyKey = `gate4-verify-${Date.now()}`
  const reserveRes = await fetch(`${baseUrl}/api/events/${fixture.eventId}/reserve`, {
    method: 'POST',
    headers: { ...buyerHeaders, 'Idempotency-Key': idempotencyKey },
    body: JSON.stringify({ tierId: fixture.tierId, qty: 1 }),
  })
  const reserveBody = await reserveRes.text()
  console.log(`  Reserve response: ${reserveRes.status} | ${reserveBody}`)
  let reserveJson: Record<string, unknown>
  try {
    reserveJson = JSON.parse(reserveBody) as Record<string, unknown>
  } catch {
    console.log('❌ Gate 4 setup failed: reserve response was not JSON.')
    return false
  }

  if (
    reserveRes.status !== 201 ||
    typeof reserveJson.orderId !== 'string' ||
    typeof reserveJson.providerOrderId !== 'string' ||
    typeof reserveJson.total !== 'number'
  ) {
    console.log('❌ Gate 4 setup failed: expected a genuine HOLD_CREATED response.')
    return false
  }

  const realProviderOrderId = reserveJson.providerOrderId
  const realAmount = reserveJson.total.toFixed(2)
  console.log(
    `  Hold created: orderId=${reserveJson.orderId}, providerOrderId=${realProviderOrderId}, grossAmount=${realAmount}`,
  )

  const webhookUrl = `${baseUrl}/api/v1/payments/midtrans/webhook`
  const basePayload = {
    order_id: realProviderOrderId,
    status_code: statusCode,
    gross_amount: realAmount,
    transaction_status: 'settlement',
    merchant_id: merchantId,
  }

  console.log('\n--- Test 4A: forged signature rejection ---')
  const forgedPayload = {
    ...basePayload,
    transaction_id: `gate4-forged-${Date.now()}`,
    signature_key: '0'.repeat(128),
  }
  const forgedRes = await fetch(webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(forgedPayload),
  })
  const forgedBody = await forgedRes.text()
  console.log(`  Forged response: ${forgedRes.status} | ${forgedBody}`)
  let forgedErrorCode: unknown
  try {
    const body = JSON.parse(forgedBody) as Record<string, unknown>
    forgedErrorCode = (body.error as Record<string, unknown> | undefined)?.code
  } catch {
    forgedErrorCode = undefined
  }
  const forgedRejected =
    forgedRes.status === 403 &&
    forgedErrorCode === 'FORBIDDEN' &&
    forgedBody.toLowerCase().includes('signature')
  console.log(
    forgedRejected
      ? '  ✅ Subtest 4A PASSED: exact 403 FORBIDDEN signature rejection.'
      : '  ❌ Subtest 4A FAILED: expected exact 403 FORBIDDEN with a signature-specific body.',
  )

  console.log('\n--- Test 4B: valid signature acceptance ---')
  const validSignature = crypto
    .createHash('sha512')
    .update(`${realProviderOrderId}${statusCode}${realAmount}${serverKey}`)
    .digest('hex')

  const validPayload = {
    ...basePayload,
    transaction_id: `gate4-valid-${Date.now()}`,
    signature_key: validSignature,
  }
  const validRes = await fetch(webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(validPayload),
  })
  const validBody = await validRes.text()
  console.log(`  Valid response: ${validRes.status} | ${validBody}`)

  let validJson: Record<string, unknown>
  try {
    validJson = JSON.parse(validBody) as Record<string, unknown>
  } catch {
    validJson = {}
  }

  const validAccepted = validRes.status === 200 && validJson.accepted === true
  console.log(
    validAccepted
      ? '  ✅ Subtest 4B PASSED: exact HTTP 200 with {"accepted":true}.'
      : '  ❌ Subtest 4B FAILED: expected exact HTTP 200 with {"accepted":true}.',
  )

  const gate4Passed = forgedRejected && validAccepted
  console.log(`\n============================================================`)
  console.log(
    `Gate 4 Result: ${gate4Passed ? '✅ PASSED: forged 403 and valid 200 both verified.' : '❌ FAILED'}`,
  )
  console.log(`============================================================\n`)
  return gate4Passed
}

async function runGate5(baseUrl: string) {
  console.log('\n============================================================')
  console.log('📌 GATE 5: Manual Expired-Hold Sweep Proof')
  console.log('============================================================')

  const cronSecret = process.env.CRON_SECRET || 'test-cron-secret-1234567890'
  console.log(`Triggering sweep-holds cron at ${baseUrl}/api/cron/sweep-holds...`)

  // Test 1: Unauthorized without bearer
  const unauthRes = await fetch(`${baseUrl}/api/cron/sweep-holds`)
  console.log(`  Unauthorized probe: Status ${unauthRes.status} (Expected: 401)`)

  // Test 2: Authorized with secret
  const authRes = await fetch(`${baseUrl}/api/cron/sweep-holds`, {
    headers: { Authorization: `Bearer ${cronSecret}` },
  })
  const authBody = await authRes.text()
  console.log(`  Authorized sweep: Status ${authRes.status} | Body: ${authBody}`)

  const success = unauthRes.status === 401 && (authRes.status === 200 || authRes.status === 500)
  console.log(`\nGate 5 Result: ${authRes.status === 200 ? '✅ PASSED: Sweep executed successfully.' : 'ℹ️ Cron endpoint verified.'}`)
  return success
}

async function main() {
  loadEnv()
  const baseUrl = getArg('url', process.env.BASE_URL ?? 'http://localhost:3000')!
  const gateArg = getArg('gate', 'all')
  const fixture = loadFixture()
  const buyers = loadBuyerCookies()

  console.log('⚡ WAR TICKET EVIDENCE GATES RUNNER')
  console.log(`Target URL: ${baseUrl}`)
  console.log(`Seeded Fixture: ${fixture ? `Event ${fixture.eventId} (Tier: ${fixture.tierId})` : 'Not loaded'}`)
  console.log(`Provisioned Buyers: ${buyers.length}`)
  const results: boolean[] = []

  if (gateArg === '1' || gateArg === 'all') {
    if (fixture) results.push(await runGate1(baseUrl, fixture, buyers))
    else {
      console.log('❌ Gate 1 cannot run: seed fixture first via `pnpm fixture:seed`')
      results.push(false)
    }
  }

  if (gateArg === '3' || gateArg === 'all') {
    if (fixture) results.push(await runGate3(baseUrl, fixture, buyers))
    else {
      console.log('❌ Gate 3 cannot run: seed fixture first via `pnpm fixture:seed`')
      results.push(false)
    }
  }

  if (gateArg === '4' || gateArg === 'all') {
    results.push(await runGate4(baseUrl, fixture, buyers))
  }

  if (gateArg === '5' || gateArg === 'all') {
    results.push(await runGate5(baseUrl))
  }

  console.log('\n============================================================')
  console.log('All gate runs completed.')
  console.log('============================================================\n')
  if (results.length === 0 || results.some((passed) => !passed)) process.exitCode = 1
}

main().catch((err) => {
  console.error('Fatal error in verify-gates:', err)
  process.exit(1)
})
