import { EmptyState } from '@/components/feedback/empty-state'

export default function ConcertNotFound() {
  return <main id="main-content" className="container-shell grid min-h-[65vh] place-items-center py-14"><EmptyState title="Konser tidak ditemukan" description="Event mungkin telah berakhir, dipindahkan, atau tidak lagi tersedia." action={{ href: '/concerts', label: 'Lihat konser lain' }} /></main>
}
