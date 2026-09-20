import * as fs from 'node:fs'
import * as path from 'node:path'
import { Redis } from '@upstash/redis'
import { edgeKeys } from '../../apps/web/lib/serverless-ticketing/keys'

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
  const root = findRepoRoot()
  const envFiles = [
    path.resolve(root, '.env.local'),
    path.resolve(root, 'apps/web/.env.local'),
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

async function main() {
  loadEnv()
  const root = findRepoRoot()
  const fixturePath = path.resolve(root, 'scripts/load-test/fixture-env.json')
  const fixture = JSON.parse(fs.readFileSync(fixturePath, 'utf-8'))
  const eventId = fixture.eventId

  const url = process.env.UPSTASH_REDIS_REST_URL!
  const token = process.env.UPSTASH_REDIS_REST_TOKEN!
  const redis = new Redis({ url, token })

  const keys = edgeKeys(eventId)
  const eventInv = await redis.get(keys.inventory)
  const tierInv = await redis.get(keys.tierInventory(fixture.tierId))
  const holdsCount = await redis.zcard(keys.holdExpiries)

  console.log(`========================================`)
  console.log(`Event ID: ${eventId}`)
  console.log(`Event Inventory Remaining: ${eventInv}`)
  console.log(`Tier Inventory Remaining:  ${tierInv}`)
  console.log(`Active Holds in Redis:     ${holdsCount}`)
  console.log(`Total (Remaining + Holds): ${Number(eventInv) + Number(holdsCount)} / ${fixture.capacity}`)
  console.log(`========================================`)
}

main().catch(console.error)
