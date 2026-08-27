import { EmptyState } from '@/components/feedback/empty-state'

export default function NotFound() {
  return <main id="main-content" className="container-shell grid min-h-[65vh] place-items-center py-14"><EmptyState title="Halaman tidak ditemukan" description="Alamat yang Anda buka tidak tersedia atau telah dipindahkan." action={{ href: '/', label: 'Kembali ke beranda' }} /></main>
}
