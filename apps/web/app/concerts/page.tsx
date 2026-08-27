import { z } from 'zod'
import { ConcertGrid } from '@/components/concert-grid'
import { EmptyState } from '@/components/feedback/empty-state'
import { PageShell } from '@/components/layout/page-shell'
import { SearchAndFilter } from '@/components/search-and-filter'
import { getCities, getConcerts } from '@/lib/queries/concerts'

const categorySchema = z.enum(['pop', 'rock', 'jazz', 'electronic', 'hiphop', 'indie', 'other'])
const statusSchema = z.enum(['available', 'limited', 'soldout'])

interface ConcertsPageProps {
  readonly searchParams: Promise<{ city?: string; category?: string; status?: string; q?: string }>
}

export default async function ConcertsPage({ searchParams }: ConcertsPageProps) {
  const params = await searchParams
  const category = categorySchema.safeParse(params.category)
  const status = statusSchema.safeParse(params.status)
  const [concerts, cities] = await Promise.all([
    getConcerts({ ...(params.city ? { city: params.city } : {}), ...(category.success ? { category: category.data } : {}), ...(status.success ? { status: status.data } : {}), ...(params.q ? { query: params.q } : {}) }),
    getCities(),
  ])
  const activeFilters = { city: params.city || '', category: params.category || '', status: params.status || '', q: params.q || '' }

  return (
    <PageShell eyebrow="Discovery" title="Temukan panggung berikutnya" description="Cari berdasarkan artis, kota, genre, atau ketersediaan tiket.">
      <SearchAndFilter cities={cities} activeFilters={activeFilters} resultsCount={concerts.length} />
      <div className="mt-8">{concerts.length ? <ConcertGrid concerts={concerts} /> : <EmptyState title="Konser tidak ditemukan" description="Coba ubah kata pencarian atau bersihkan filter untuk melihat event lainnya." />}</div>
    </PageShell>
  )
}
