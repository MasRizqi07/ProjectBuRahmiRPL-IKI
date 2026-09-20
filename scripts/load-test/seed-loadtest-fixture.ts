import { createClient } from '@supabase/supabase-js'
import * as fs from 'node:fs'
import * as path from 'node:path'

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
          const val = trimmed.slice(eqIdx + 1).trim()
          if (!process.env[key] && val) {
            process.env[key] = val
          }
        }
      }
    }
  }
}

async function main() {
  loadEnv()

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY

  if (!supabaseUrl || !serviceRoleKey) {
    console.error('❌ Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
    process.exit(1)
  }

  const adminClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  console.log('🔍 Checking database connection & schema...')
  const { error: testError } = await adminClient.from('concerts').select('id').limit(1)
  if (testError) {
    console.error('❌ Could not query public.concerts:', testError.message)
    console.error('👉 Please apply migrations first via `pnpm db:migrate` or paste `combined_001_to_009_and_seed.sql` into Supabase SQL Editor.')
    process.exit(1)
  }

  const fixtureTitle = 'WAR TICKET 10K GATE: 100-TICKET FIXTURE'
  console.log(`🔎 Looking for existing fixture '${fixtureTitle}'...`)

  const { data: existingConcerts } = await adminClient
    .from('concerts')
    .select('id, ticket_tiers(id, name, capacity, sold, price)')
    .eq('title', fixtureTitle)
    .limit(1)

  let eventId: string
  let tierId: string

  if (existingConcerts && existingConcerts.length > 0) {
    eventId = existingConcerts[0].id
    const existingTiers = (existingConcerts[0].ticket_tiers as Array<{ id: string; capacity: number; sold: number }>) ?? []
    if (existingTiers.length > 0) {
      tierId = existingTiers[0].id
      console.log(`♻️ Reusing existing fixture event: ${eventId}`)
      // Reset capacity to 100, sold to 0
      await adminClient
        .from('ticket_tiers')
        .update({ capacity: 100, sold: 0 })
        .eq('id', tierId)
      console.log(`🔄 Reset tier ${tierId} to capacity=100, sold=0`)
    } else {
      const { data: newTier, error: tierErr } = await adminClient
        .from('ticket_tiers')
        .insert({
          concert_id: eventId,
          name: 'WAR-100 VIP Gate',
          price: 350000,
          capacity: 100,
          sold: 0,
        })
        .select('id')
        .single()
      if (tierErr || !newTier) throw tierErr ?? new Error('Failed to create tier')
      tierId = newTier.id
    }
  } else {
    console.log('✨ Creating new 100-ticket fixture concert and tier...')
    const { data: newConcert, error: concertErr } = await adminClient
      .from('concerts')
      .insert({
        title: fixtureTitle,
        artist: 'Antigravity Gate Engine',
        venue: 'Jakarta International Stadium',
        city: 'Jakarta',
        date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        category: 'electronic',
        status: 'available',
        description: 'Automated 10,000-concurrent load test fixture with exactly 100 tickets.',
        is_featured: true,
      })
      .select('id')
      .single()

    if (concertErr || !newConcert) {
      console.error('❌ Failed to create fixture concert:', concertErr)
      process.exit(1)
    }

    eventId = newConcert.id

    const { data: newTier, error: tierErr } = await adminClient
      .from('ticket_tiers')
      .insert({
        concert_id: eventId,
        name: 'WAR-100 VIP Gate',
        price: 350000,
        capacity: 100,
        sold: 0,
      })
      .select('id')
      .single()

    if (tierErr || !newTier) {
      console.error('❌ Failed to create fixture tier:', tierErr)
      process.exit(1)
    }

    tierId = newTier.id
    console.log('✅ Created 1-event, 1-tier, 100-ticket fixture!')
  }

  const fixtureInfo = {
    eventId,
    tierId,
    capacity: 100,
    price: 350000,
    timestamp: new Date().toISOString(),
  }

  const repoRoot = findRepoRoot()
  const outPath = path.resolve(repoRoot, 'scripts/load-test/fixture-env.json')
  fs.writeFileSync(outPath, JSON.stringify(fixtureInfo, null, 2), 'utf-8')

  console.log('\n============================================================')
  console.log('🎯 LOAD TEST FIXTURE READY:')
  console.log(`  EVENT_ID=${eventId}`)
  console.log(`  TIER_ID=${tierId}`)
  console.log(`  CAPACITY=100`)
  console.log(`  Saved to: ${outPath}`)
  console.log('============================================================\n')
}

main().catch((err) => {
  console.error('Fatal error seeding fixture:', err)
  process.exit(1)
})

