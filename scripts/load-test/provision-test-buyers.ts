import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { createServerClient } from '@supabase/ssr'
import * as fs from 'node:fs'
import * as path from 'node:path'

// Helper to parse CLI flags
function getArg(name: string, defaultValue?: string): string | undefined {
  const argIndex = process.argv.findIndex((a) => a === `--${name}` || a.startsWith(`--${name}=`))
  if (argIndex === -1) return defaultValue
  const arg = process.argv[argIndex]
  if (arg.includes('=')) {
    return arg.split('=')[1]
  }
  return process.argv[argIndex + 1] ?? defaultValue
}

function hasFlag(name: string): boolean {
  return process.argv.some((a) => a === `--${name}`)
}

async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

// Load env variables if not in process.env
function loadEnv() {
  const envFiles = [
    path.resolve(process.cwd(), '.env.local'),
    path.resolve(process.cwd(), 'apps/web/.env.local'),
    path.resolve(process.cwd(), '.env'),
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
          const val = trimmed.slice(eqIdx + 1).trim()
          if (!process.env[key] && val) {
            process.env[key] = val
          }
        }
      }
    }
  }
}

interface ProvisionResult {
  index: number
  email: string
  userId: string
  cookieString: string
}

async function run() {
  loadEnv()

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseAnonKey || !serviceRoleKey) {
    console.error('Missing required environment variables:')
    if (!supabaseUrl) console.error('  - NEXT_PUBLIC_SUPABASE_URL / SUPABASE_URL')
    if (!supabaseAnonKey) console.error('  - NEXT_PUBLIC_SUPABASE_ANON_KEY / SUPABASE_ANON_KEY')
    if (!serviceRoleKey) console.error('  - SUPABASE_SERVICE_ROLE_KEY')
    process.exit(1)
  }

  const count = parseInt(getArg('count', '20')!, 10)
  const batchSize = parseInt(getArg('batch-size', '25')!, 10)
  const prefix = getArg('prefix', 'loadtest-buyer')!
  const password = getArg('password', 'WarTicketLoadTest!2026')!
  const outFile = path.resolve(process.cwd(), getArg('out', 'scripts/load-test/cookies.json')!)
  const verifyAdmission = hasFlag('verify-admission')
  const baseUrl = getArg('base-url', process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000')!
  const eventId = getArg('event-id', process.env.EVENT_ID)

  console.log(`====================================================`)
  console.log(`WAR TICKET — Test Buyer Provisioning Harness`)
  console.log(`Supabase URL: ${supabaseUrl}`)
  console.log(`Target Buyers: ${count}`)
  console.log(`Batch Size: ${batchSize}`)
  console.log(`Output File: ${outFile}`)
  if (verifyAdmission) {
    console.log(`Verify Admission: true (Base URL: ${baseUrl}, Event ID: ${eventId ?? 'none'})`)
  }
  console.log(`====================================================\n`)

  const adminClient = createSupabaseClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })

  // Ensure output directory exists
  const outDir = path.dirname(outFile)
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true })
  }

  const buyers: ProvisionResult[] = []
  const startTime = Date.now()

  for (let batchStart = 1; batchStart <= count; batchStart += batchSize) {
    const batchEnd = Math.min(batchStart + batchSize - 1, count)
    console.log(`[Provision] Processing batch ${batchStart} to ${batchEnd} of ${count}...`)

    const batchIndices = Array.from({ length: batchEnd - batchStart + 1 }, (_, i) => batchStart + i)

    const batchResults = await Promise.all(
      batchIndices.map(async (idx) => {
        const email = `${prefix}-${String(idx).padStart(5, '0')}@warticket.test`

        // 1. Create or ensure user exists with confirmed email
        let userId = ''
        let retries = 0
        while (retries < 5) {
          try {
            const { data, error } = await adminClient.auth.admin.createUser({
              email,
              password,
              email_confirm: true,
            })

            if (error) {
              if (error.message.includes('already registered') || error.message.includes('already exists')) {
                // User already exists, fetch ID
                const { data: listData } = await adminClient.auth.admin.listUsers()
                const existing = listData?.users.find((u) => u.email === email)
                if (existing) {
                  userId = existing.id
                  // Ensure password matches
                  await adminClient.auth.admin.updateUserById(userId, { password, email_confirm: true })
                  break
                }
              }

              // Rate limited (429) or transient error
              const waitMs = Math.min(1000 * Math.pow(2, retries) + Math.random() * 500, 10000)
              console.warn(`[WARN] Create user ${email} failed: ${error.message}. Retrying in ${waitMs}ms...`)
              await sleep(waitMs)
              retries++
              continue
            }

            if (data?.user) {
              userId = data.user.id
              break
            }
          } catch (err) {
            const waitMs = Math.min(1000 * Math.pow(2, retries) + Math.random() * 500, 10000)
            console.warn(`[WARN] Exception creating user ${email}: ${(err as Error).message}. Retrying in ${waitMs}ms...`)
            await sleep(waitMs)
            retries++
          }
        }

        if (!userId) {
          throw new Error(`Failed to create or retrieve user ${email} after retries`)
        }

        // 2. Sign in with password and capture @supabase/ssr formatted cookies
        let cookieString = ''
        retries = 0
        while (retries < 5) {
          try {
            const cookieStore = new Map<string, string>()
            const ssrClient = createServerClient(supabaseUrl, supabaseAnonKey, {
              cookies: {
                getAll() {
                  return Array.from(cookieStore.entries()).map(([name, value]) => ({ name, value }))
                },
                setAll(cookiesToSet) {
                  for (const { name, value } of cookiesToSet) {
                    cookieStore.set(name, value)
                  }
                },
              },
            })

            const { data, error } = await ssrClient.auth.signInWithPassword({
              email,
              password,
            })

            if (error) {
              const waitMs = Math.min(1000 * Math.pow(2, retries) + Math.random() * 500, 10000)
              console.warn(`[WARN] Sign-in for ${email} failed: ${error.message}. Retrying in ${waitMs}ms...`)
              await sleep(waitMs)
              retries++
              continue
            }

            if (data?.session) {
              cookieString = Array.from(cookieStore.entries())
                .map(([k, v]) => `${k}=${v}`)
                .join('; ')
              break
            }
          } catch (err) {
            const waitMs = Math.min(1000 * Math.pow(2, retries) + Math.random() * 500, 10000)
            console.warn(`[WARN] Exception signing in ${email}: ${(err as Error).message}. Retrying in ${waitMs}ms...`)
            await sleep(waitMs)
            retries++
          }
        }

        if (!cookieString) {
          throw new Error(`Failed to capture session cookies for user ${email}`)
        }

        return {
          index: idx,
          email,
          userId,
          cookieString,
        }
      })
    )

    buyers.push(...batchResults)

    // Optional short delay between batches to respect Auth rate limits
    if (batchEnd < count) {
      await sleep(200)
    }
  }

  const durationSec = ((Date.now() - startTime) / 1000).toFixed(2)
  console.log(`\n[Success] Provisioned and signed in ${buyers.length} buyers in ${durationSec}s.`)

  // Save the array of cookie strings to the target JSON file
  const cookiesArray = buyers.map((b) => b.cookieString)
  fs.writeFileSync(outFile, JSON.stringify(cookiesArray, null, 2), 'utf-8')
  console.log(`[Output] Wrote ${cookiesArray.length} cookie strings to ${outFile}`)

  // Also save a mapping file for reference/teardown
  const mapFile = outFile.replace(/\.json$/, '-users.json')
  fs.writeFileSync(
    mapFile,
    JSON.stringify(
      buyers.map((b) => ({ index: b.index, email: b.email, userId: b.userId })),
      null,
      2
    ),
    'utf-8'
  )
  console.log(`[Output] Wrote buyer user mapping to ${mapFile}`)

  // Dry run verification if requested
  if (verifyAdmission && eventId) {
    console.log(`\n--- Running Dry-Run Queue Admission Smoke Test (Sample: 3 buyers) ---`)
    const sampleBuyers = buyers.slice(0, 3)

    for (const buyer of sampleBuyers) {
      console.log(`\n[Smoke Test] Buyer ${buyer.index} (${buyer.email}) joining queue...`)
      try {
        const joinRes = await fetch(`${baseUrl}/api/events/${eventId}/join-queue`, {
          method: 'POST',
          headers: {
            Cookie: buyer.cookieString,
            Origin: baseUrl,
            'Content-Type': 'application/json',
          },
        })
        const joinBody = await joinRes.text()
        console.log(`Join status: ${joinRes.status} | Body: ${joinBody}`)

        const statusRes = await fetch(`${baseUrl}/api/events/${eventId}/queue-status`, {
          method: 'GET',
          headers: {
            Cookie: buyer.cookieString,
            Origin: baseUrl,
          },
        })
        const statusBody = await statusRes.text()
        console.log(`Queue status: ${statusRes.status} | Body: ${statusBody}`)
      } catch (err) {
        console.error(`[Smoke Test ERROR] Failed hitting endpoints: ${(err as Error).message}`)
      }
    }
  }
}

run().catch((err) => {
  console.error('Fatal error in provision-test-buyers:', err)
  process.exit(1)
})

