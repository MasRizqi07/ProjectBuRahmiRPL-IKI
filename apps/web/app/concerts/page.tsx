import { Navbar } from '@/components/navbar'
import { SearchAndFilter } from '@/components/search-and-filter'
import { ConcertGrid } from '@/components/concert-grid'
import { getConcerts, getCities } from '@/lib/queries/concerts'
import { z } from 'zod'

const categorySchema = z.enum(['pop', 'rock', 'jazz', 'electronic', 'hiphop', 'indie', 'other'])
const statusSchema = z.enum(['available', 'limited', 'soldout'])

interface ConcertsPageProps {
  searchParams: Promise<{
    city?: string
    category?: string
    status?: string
    q?: string
  }>
}

export default async function ConcertsPage({ searchParams }: ConcertsPageProps) {
  const params = await searchParams
  const category = categorySchema.safeParse(params.category)
  const status = statusSchema.safeParse(params.status)
  
  const [concerts, cities] = await Promise.all([
    getConcerts({
      ...(params.city ? { city: params.city } : {}),
      ...(category.success ? { category: category.data } : {}),
      ...(status.success ? { status: status.data } : {}),
      ...(params.q ? { query: params.q } : {}),
    }),
    getCities(),
  ])

  const isEmpty = concerts.length === 0
  const activeFilters = {
    city: params.city || '',
    category: params.category || '',
    status: params.status || '',
    q: params.q || '',
  }

  return (
    <div className="min-h-screen bg-zinc-950">
      <Navbar />

      <main id="main-content" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-12 sm:pt-32">
        <div className="mb-8 animate-fade-up">
          <h1 className="font-display text-4xl sm:text-5xl font-black text-white mb-2">
            Jelajahi Konser
          </h1>
          <p className="text-zinc-400 font-body">
            Temukan dan pesan tiket konser favoritmu dari ribuan pilihan
          </p>
        </div>

        <div className="mb-10 animate-fade-up">
          <SearchAndFilter
            cities={cities}
            activeFilters={activeFilters}
            resultsCount={concerts.length}
          />
        </div>

        {isEmpty ? (
          <div className="text-center py-16 animate-fade-up">
            <p className="font-body text-zinc-400 text-lg">
              Tidak ada konser yang sesuai dengan pencarian Anda.
            </p>
          </div>
        ) : (
          <ConcertGrid concerts={concerts} />
        )}
      </main>
    </div>
  )
}
