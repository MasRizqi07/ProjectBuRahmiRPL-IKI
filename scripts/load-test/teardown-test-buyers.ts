import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import * as fs from 'node:fs'
import * as path from 'node:path'

function getArg(name: string, defaultValue?: string): string | undefined {
  const argIndex = process.argv.findIndex((a) => a === `--${name}` || a.startsWith(`--${name}=`))
  if (argIndex === -1) return defaultValue
  const arg = process.argv[argIndex]
  if (arg.includes('=')) {
    return arg.split('=')[1]
  }
  return process.argv[argIndex + 1] ?? defaultValue
}

async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

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

async function run() {
  loadEnv()

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceRoleKey) {
    console.error('Missing required environment variables:')
    if (!supabaseUrl) console.error('  - NEXT_PUBLIC_SUPABASE_URL / SUPABASE_URL')
    if (!serviceRoleKey) console.error('  - SUPABASE_SERVICE_ROLE_KEY')
    process.exit(1)
  }

  const mapFile = path.resolve(process.cwd(), getArg('users-file', 'scripts/load-test/cookies-users.json')!)
  const prefix = getArg('prefix', 'loadtest-buyer')!
  const batchSize = parseInt(getArg('batch-size', '50')!, 10)

  const adminClient = createSupabaseClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })

  console.log(`====================================================`)
  console.log(`WAR TICKET — Test Buyer Teardown Harness`)
  console.log(`Supabase URL: ${supabaseUrl}`)
  console.log(`Prefix: ${prefix}`)
  console.log(`====================================================\n`)

  let userIdsToDelete: string[] = []

  if (fs.existsSync(mapFile)) {
    console.log(`Loading user list from ${mapFile}...`)
    try {
      const parsed = JSON.parse(fs.readFileSync(mapFile, 'utf-8'))
      if (Array.isArray(parsed)) {
        userIdsToDelete = parsed.map((u: { userId: string }) => u.userId).filter(Boolean)
      }
    } catch (e) {
      console.warn(`Could not parse ${mapFile}: ${(e as Error).message}. Falling back to listUsers API.`)
    }
  }

  if (userIdsToDelete.length === 0) {
    console.log(`Querying Supabase Auth for users matching prefix "${prefix}"...`)
    let page = 1
    const perPage = 1000
    while (true) {
      const { data, error } = await adminClient.auth.admin.listUsers({
        page,
        perPage,
      })
      if (error) {
        throw new Error(`Failed to list users: ${error.message}`)
      }
      if (!data || data.users.length === 0) break

      const matching = data.users.filter((u) => u.email?.includes(prefix)).map((u) => u.id)
      userIdsToDelete.push(...matching)

      if (data.users.length < perPage) break
      page++
    }
  }

  console.log(`Found ${userIdsToDelete.length} test buyer accounts to delete.\n`)

  if (userIdsToDelete.length === 0) {
    console.log('No accounts to clean up. Exiting.')
    return
  }

  let deletedCount = 0
  const startTime = Date.now()

  for (let i = 0; i < userIdsToDelete.length; i += batchSize) {
    const chunk = userIdsToDelete.slice(i, i + batchSize)
    console.log(`Deleting batch ${i + 1} to ${Math.min(i + batchSize, userIdsToDelete.length)}...`)

    await Promise.all(
      chunk.map(async (id) => {
        let retries = 0
        while (retries < 3) {
          try {
            const { error } = await adminClient.auth.admin.deleteUser(id)
            if (error) {
              const waitMs = 500 * Math.pow(2, retries)
              await sleep(waitMs)
              retries++
              continue
            }
            deletedCount++
            break
          } catch {
            retries++
            await sleep(500)
          }
        }
      })
    )
  }

  const durationSec = ((Date.now() - startTime) / 1000).toFixed(2)
  console.log(`\n[Success] Deleted ${deletedCount} of ${userIdsToDelete.length} test users in ${durationSec}s.`)

  // Clean up cookies files if present
  if (fs.existsSync(mapFile)) {
    fs.unlinkSync(mapFile)
    console.log(`Removed ${mapFile}`)
  }
  const cookiesFile = mapFile.replace(/-users\.json$/, '.json')
  if (fs.existsSync(cookiesFile)) {
    fs.unlinkSync(cookiesFile)
    console.log(`Removed ${cookiesFile}`)
  }
}

run().catch((err) => {
  console.error('Fatal error in teardown-test-buyers:', err)
  process.exit(1)
})

