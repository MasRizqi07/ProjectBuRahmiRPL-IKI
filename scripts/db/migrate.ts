import * as fs from 'node:fs'
import * as path from 'node:path'
import postgres from 'postgres'

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
  const repoRoot = findRepoRoot()
  const migrationsDir = path.resolve(repoRoot, 'supabase/migrations')
  const seedFile = path.resolve(repoRoot, 'supabase/seed.sql')

  const migrationFiles = [
    '001_initial_schema.sql',
    '002_ticketing_engine.sql',
    '003_serverless_checkout.sql',
    '004_legacy_order_hardening.sql',
    '005_auth_rbac_hardening.sql',
    '006_buyer_experience.sql',
    '007_organizer_operations.sql',
    '008_admin_governance.sql',
    '009_engagement_elite.sql',
  ]

  console.log('📦 Bundling migrations 001 through 009...')
  let combinedSchema = `-- ====================================================================
-- WAR TICKET PLATFORM: COMPLETE CONSOLIDATED MIGRATION
-- Automatically cleans existing relations to prevent 42P07 conflicts
-- ====================================================================

-- 1. CLEAN TEARDOWN (Ensures script can run repeatedly without "relation already exists" errors)
drop table if exists public.promo_redemptions cascade;
drop table if exists public.promo_campaigns cascade;
drop table if exists public.community_messages cascade;
drop table if exists public.event_subscriptions cascade;
drop table if exists public.elite_memberships cascade;
drop table if exists public.support_cases cascade;
drop table if exists public.disputes cascade;
drop table if exists public.organizer_applications cascade;
drop table if exists public.orders cascade;
drop table if exists public.ticket_tiers cascade;
drop table if exists public.concerts cascade;
drop table if exists public.profiles cascade;
drop schema if exists ticketing cascade;

-- 2. ENABLE EXTENSIONS
create extension if not exists "uuid-ossp";
create extension if not exists pgcrypto;

`
  for (const file of migrationFiles) {
    const filePath = path.resolve(migrationsDir, file)
    if (fs.existsSync(filePath)) {
      combinedSchema += `-- ==========================================\n`
      combinedSchema += `-- FILE: ${file}\n`
      combinedSchema += `-- ==========================================\n`
      combinedSchema += fs.readFileSync(filePath, 'utf-8') + '\n\n'
    } else {
      console.warn(`⚠️ Warning: Migration file not found: ${filePath}`)
    }
  }

  const combinedSchemaPath = path.resolve(migrationsDir, 'combined_001_to_009_schema_only.sql')
  fs.writeFileSync(combinedSchemaPath, combinedSchema, 'utf-8')
  console.log(`✅ Generated schema bundle: ${combinedSchemaPath}`)

  let combinedAll = combinedSchema
  if (fs.existsSync(seedFile)) {
    combinedAll += `-- ==========================================\n`
    combinedAll += `-- FILE: seed.sql\n`
    combinedAll += `-- ==========================================\n`
    combinedAll += fs.readFileSync(seedFile, 'utf-8') + '\n\n'
  }
  const combinedAllPath = path.resolve(migrationsDir, 'combined_001_to_009_and_seed.sql')
  fs.writeFileSync(combinedAllPath, combinedAll, 'utf-8')
  console.log(`✅ Generated full bundle (with seed): ${combinedAllPath}`)

  const databaseUrl = process.env.DATABASE_URL
  if (!databaseUrl) {
    console.log('\n------------------------------------------------------------')
    console.log('ℹ️  DATABASE_URL is not set in your .env.local')
    console.log('You have two fast options to apply all migrations to Supabase:')
    console.log('------------------------------------------------------------')
    console.log('OPTION 1: One-click in Supabase Dashboard SQL Editor (Recommended)')
    console.log('  1. Open your project SQL Editor:')
    console.log('     https://supabase.com/dashboard/project/_/sql/new')
    console.log('  2. Copy the entire contents of:')
    console.log(`     ${combinedAllPath}`)
    console.log('  3. Paste into the SQL editor and click "Run" (Ctrl + Enter).')
    console.log('\nOPTION 2: Add DATABASE_URL to .env.local and re-run pnpm db:migrate')
    console.log('  1. In Supabase Dashboard -> Project Settings -> Database:')
    console.log('     Copy the Connection String (URI).')
    console.log('  2. Add it to .env.local:')
    console.log('     DATABASE_URL="postgresql://postgres.[ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres"')
    console.log('  3. Run: pnpm db:migrate')
    console.log('------------------------------------------------------------\n')
    return
  }

  console.log('\n🚀 Connecting to database via DATABASE_URL...')
  const isLocal = databaseUrl.includes('localhost') || databaseUrl.includes('127.0.0.1')
  const sql = postgres(databaseUrl, {
    ssl: isLocal ? false : 'require',
    max: 1,
    connect_timeout: 10,
  })

  try {
    // Migration tracking table
    await sql.unsafe(`
      create table if not exists public._migrations (
        name text primary key,
        applied_at timestamptz not null default now()
      );
    `)

    const appliedRows = await sql<{ name: string }[]>`select name from public._migrations`
    const applied = new Set(appliedRows.map((r) => r.name))

    for (const file of migrationFiles) {
      if (applied.has(file)) {
        console.log(`⏩ Skipping already applied migration: ${file}`)
        continue
      }

      console.log(`▶️ Applying migration: ${file}...`)
      const filePath = path.resolve(migrationsDir, file)
      const content = fs.readFileSync(filePath, 'utf-8')

      await sql.begin(async (tx) => {
        await tx.unsafe(content)
        await tx.unsafe(`insert into public._migrations (name) values (${tx(file)})`)
      })
      console.log(`✅ Applied: ${file}`)
    }

    const shouldSeed = process.argv.includes('--seed') || !applied.has('seed.sql')
    if (shouldSeed && fs.existsSync(seedFile)) {
      if (!applied.has('seed.sql')) {
        console.log('🌱 Applying seed data (seed.sql)...')
        const seedContent = fs.readFileSync(seedFile, 'utf-8')
        await sql.begin(async (tx) => {
          await tx.unsafe(seedContent)
          await tx.unsafe(`insert into public._migrations (name) values ('seed.sql')`)
        })
        console.log('✅ Applied seed data successfully!')
      } else {
        console.log('⏩ Seed already recorded in _migrations.')
      }
    }

    console.log('\n🎉 All migrations completed successfully!')
  } catch (error) {
    console.error('\n❌ Migration failed:', error)
    process.exit(1)
  } finally {
    await sql.end()
  }
}

main().catch((err) => {
  console.error('Fatal error running migration:', err)
  process.exit(1)
})

