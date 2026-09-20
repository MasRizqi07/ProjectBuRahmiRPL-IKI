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

  console.log(`Resetting Redis state for event ${eventId}...`)
  const keys = edgeKeys(eventId)
  
  // Clean known keys
  await redis.del(
    keys.inventory,
    keys.tierInventory(fixture.tierId),
    keys.tierQuote(fixture.tierId),
    keys.queue,
    keys.queueSequence,
    keys.states,
    keys.released,
    keys.admissionExpiries,
    keys.holdExpiries,
    keys.expiredOrders,
    keys.initializationLock('inventory'),
    keys.initializationLock(`tier-quote:${fixture.tierId}`)
  )

  // Scan and delete any remaining keys matching pattern
  let cursor = 0
  do {
    const res = await redis.scan(cursor, { match: `*${eventId}*`, count: 100 })
    cursor = Number(res[0])
    const matchedKeys = res[1] as string[]
    if (matchedKeys.length > 0) {
      await redis.del(...matchedKeys)
    }
  } while (cursor !== 0)

  console.log(`✅ Redis state for event ${eventId} successfully reset!`)
}

main().catch(console.error)
