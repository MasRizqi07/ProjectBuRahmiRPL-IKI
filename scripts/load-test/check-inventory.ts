import * as fs from 'node:fs'
import * as path from 'node:path'
import { edgeKeys } from '../../apps/web/lib/serverless-ticketing/keys'
import { edgeRedis } from '../../apps/web/lib/serverless-ticketing/redis'

export interface InventoryFixture {
  eventId: string
  tierId: string
  capacity: number
}

export interface InventorySnapshot {
  eventInventory: number | null
  tierInventory: number | null
  activeHolds: number
}

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

export async function printInventoryAudit(
  redis: ReturnType<typeof edgeRedis>,
  fixture: InventoryFixture,
  label?: string,
): Promise<InventorySnapshot> {
  const keys = edgeKeys(fixture.eventId)
  const [eventInventory, tierInventory, activeHolds] = await Promise.all([
    redis.get<number>(keys.inventory),
    redis.get<number>(keys.tierInventory(fixture.tierId)),
    redis.zcard(keys.holdExpiries),
  ])

  if (label) console.log(label)
  console.log(`========================================`)
  console.log(`Event ID: ${fixture.eventId}`)
  console.log(`Event Inventory Remaining: ${eventInventory}`)
  console.log(`Tier Inventory Remaining:  ${tierInventory}`)
  console.log(`Active Holds in Redis:     ${activeHolds}`)
  console.log(`Total (Remaining + Holds): ${Number(eventInventory) + activeHolds} / ${fixture.capacity}`)
  console.log(`========================================`)

  return { eventInventory, tierInventory, activeHolds }
}

async function main() {
  loadEnv()
  const root = findRepoRoot()
  const fixturePath = path.resolve(root, 'scripts/load-test/fixture-env.json')
  const fixture = JSON.parse(fs.readFileSync(fixturePath, 'utf-8')) as InventoryFixture
  await printInventoryAudit(edgeRedis(), fixture)
}

const entrypoint = process.argv[1]
if (entrypoint && path.basename(entrypoint) === 'check-inventory.ts') {
  main().catch((error) => {
    console.error(error)
    process.exitCode = 1
  })
}
