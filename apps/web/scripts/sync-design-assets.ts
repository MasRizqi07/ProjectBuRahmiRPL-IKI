import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises'
import { dirname, join, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'

const scriptDirectory = dirname(fileURLToPath(import.meta.url))
const projectRoot = resolve(scriptDirectory, '../../..')
const designRoot = join(projectRoot, 'Design')
const webRoot = resolve(scriptDirectory, '..')
const outputRoot = join(webRoot, 'public/images/design')
const manifestPath = join(webRoot, 'lib/assets/design-assets.ts')
const imagePattern = /https:\/\/lh3\.googleusercontent\.com\/aida-public\/[A-Za-z0-9_-]+/g
const concurrency = 4

interface DiscoveredAsset {
  readonly group: string
  readonly index: number
  readonly sourceFile: string
  readonly url: string
}

interface ProcessedAsset {
  readonly id: string
  readonly group: string
  readonly sourceFile: string
  readonly alt: string
  readonly width: number
  readonly height: number
  readonly aspectRatio: number
  readonly blurDataUrl: string
  readonly src: string
  readonly avifSrc: string
  readonly cardSrc: string
  readonly heroSrc: string
}

type ManifestAsset = Omit<ProcessedAsset, 'group'>

function humanize(slug: string): string {
  return slug
    .replace(/^war_ticket_/, '')
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

async function discoverAssets(): Promise<DiscoveredAsset[]> {
  const entries = await readdir(designRoot, { withFileTypes: true })
  const assets: DiscoveredAsset[] = []

  for (const entry of entries.sort((left, right) => left.name.localeCompare(right.name))) {
    if (!entry.isDirectory()) continue
    const htmlPath = join(designRoot, entry.name, 'code.html')
    let html: string
    try {
      html = await readFile(htmlPath, 'utf8')
    } catch {
      continue
    }

    const urls = [...new Set(html.match(imagePattern) ?? [])]
    urls.forEach((url, index) => {
      assets.push({
        group: entry.name,
        index: index + 1,
        sourceFile: relative(projectRoot, htmlPath).replaceAll('\\', '/'),
        url,
      })
    })
  }

  return assets
}

async function fetchImage(url: string): Promise<Buffer> {
  const response = await fetch(url, {
    headers: { 'User-Agent': 'WarTicketDesignAssetPipeline/1.0' },
    signal: AbortSignal.timeout(30_000),
  })
  if (!response.ok) throw new Error(`Asset request failed (${response.status})`)
  return Buffer.from(await response.arrayBuffer())
}

async function processAsset(asset: DiscoveredAsset): Promise<ProcessedAsset> {
  const buffer = await fetchImage(asset.url)
  const image = sharp(buffer, { failOn: 'warning' }).rotate()
  const metadata = await image.metadata()
  const { width, height } = metadata
  if (!width || !height) throw new Error('Image dimensions are unavailable')

  const baseName = `${asset.group.replace(/^war_ticket_/, '')}-${String(asset.index).padStart(2, '0')}`
  const groupDirectory = join(outputRoot, asset.group)
  await mkdir(groupDirectory, { recursive: true })

  const variants = {
    webp: `${baseName}.webp`,
    avif: `${baseName}.avif`,
    card: `${baseName}-card.webp`,
    hero: `${baseName}-hero.webp`,
  }

  await Promise.all([
    sharp(buffer).rotate().resize({ width: 1920, withoutEnlargement: true }).webp({ quality: 82 }).toFile(join(groupDirectory, variants.webp)),
    sharp(buffer).rotate().resize({ width: 1920, withoutEnlargement: true }).avif({ quality: 56 }).toFile(join(groupDirectory, variants.avif)),
    sharp(buffer).rotate().resize(768, 480, { fit: 'cover', position: 'attention' }).webp({ quality: 80 }).toFile(join(groupDirectory, variants.card)),
    sharp(buffer).rotate().resize(1600, 900, { fit: 'cover', position: 'attention' }).webp({ quality: 82 }).toFile(join(groupDirectory, variants.hero)),
  ])

  const blurBuffer = await sharp(buffer).rotate().resize({ width: 16, withoutEnlargement: true }).webp({ quality: 24 }).toBuffer()
  const publicBase = `/images/design/${asset.group}/${baseName}`

  return {
    id: `${asset.group}-${asset.index}`,
    group: asset.group,
    sourceFile: asset.sourceFile,
    alt: `${humanize(asset.group)} visual ${asset.index}`,
    width,
    height,
    aspectRatio: Number((width / height).toFixed(4)),
    blurDataUrl: `data:image/webp;base64,${blurBuffer.toString('base64')}`,
    src: `${publicBase}.webp`,
    avifSrc: `${publicBase}.avif`,
    cardSrc: `${publicBase}-card.webp`,
    heroSrc: `${publicBase}-hero.webp`,
  }
}

async function mapWithConcurrency<T, R>(
  items: readonly T[],
  worker: (item: T) => Promise<R>,
): Promise<R[]> {
  const results = new Array<R>(items.length)
  let cursor = 0

  async function consume(): Promise<void> {
    while (cursor < items.length) {
      const index = cursor++
      results[index] = await worker(items[index]!)
      process.stdout.write(`\rProcessed ${index + 1}/${items.length}`)
    }
  }

  await Promise.all(Array.from({ length: Math.min(concurrency, items.length) }, consume))
  process.stdout.write('\n')
  return results
}

function toManifestAsset(asset: ProcessedAsset): ManifestAsset {
  return {
    id: asset.id,
    sourceFile: asset.sourceFile,
    alt: asset.alt,
    width: asset.width,
    height: asset.height,
    aspectRatio: asset.aspectRatio,
    blurDataUrl: asset.blurDataUrl,
    src: asset.src,
    avifSrc: asset.avifSrc,
    cardSrc: asset.cardSrc,
    heroSrc: asset.heroSrc,
  }
}

function serializeManifest(assets: readonly ProcessedAsset[]): string {
  const groups = Object.groupBy(assets, (asset) => asset.group)
  const serializedGroups = Object.fromEntries(
    Object.entries(groups).map(([group, values]) => [group, (values ?? []).map(toManifestAsset)]),
  )

  return `// Generated by apps/web/scripts/sync-design-assets.ts. Do not edit manually.\n\n` +
    `export interface DesignAsset {\n` +
    `  readonly id: string\n` +
    `  readonly sourceFile: string\n` +
    `  readonly alt: string\n` +
    `  readonly width: number\n` +
    `  readonly height: number\n` +
    `  readonly aspectRatio: number\n` +
    `  readonly blurDataUrl: string\n` +
    `  readonly src: string\n` +
    `  readonly avifSrc: string\n` +
    `  readonly cardSrc: string\n` +
    `  readonly heroSrc: string\n` +
    `}\n\n` +
    `export const designAssets = ${JSON.stringify(serializedGroups, null, 2)} as const satisfies Record<string, readonly DesignAsset[]>\n\n` +
    `export type DesignAssetGroup = keyof typeof designAssets\n\n` +
    `export const designAssetByPath = Object.fromEntries(\n` +
    `  Object.values(designAssets).flat().flatMap((asset) => [asset.src, asset.avifSrc, asset.cardSrc, asset.heroSrc].map((path) => [path, asset])),\n` +
    `) as Readonly<Record<string, DesignAsset>>\n\n` +
    `export function getDesignAsset(group: DesignAssetGroup, index = 0): DesignAsset {\n` +
    `  const asset = designAssets[group][index] as DesignAsset | undefined\n` +
    `  if (!asset) throw new Error(\`Missing Design asset: \${group}[\${index}]\`)\n` +
    `  return asset\n` +
    `}\n`
}

async function main(): Promise<void> {
  const discovered = await discoverAssets()
  if (discovered.length === 0) throw new Error('No Design image URLs were discovered')

  await mkdir(dirname(manifestPath), { recursive: true })
  const processed = await mapWithConcurrency(discovered, processAsset)
  await writeFile(manifestPath, serializeManifest(processed), 'utf8')
  process.stdout.write(`Generated ${processed.length} localized assets and ${relative(projectRoot, manifestPath)}\n`)
}

void main().catch((error: unknown) => {
  const message = error instanceof Error ? error.stack ?? error.message : String(error)
  process.stderr.write(`${message}\n`)
  process.exitCode = 1
})
