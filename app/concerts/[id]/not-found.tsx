import Link from 'next/link'

export default function ConcertNotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center">
      <p className="text-5xl font-display font-bold text-white/10">404</p>
      <h2 className="text-xl font-display font-bold text-white">Konser Tidak Ditemukan</h2>
      <p className="text-white/50 font-body">Konser yang kamu cari mungkin sudah berakhir atau tidak tersedia.</p>
      <Link 
        href="/concerts" 
        className="mt-4 bg-white/5 hover:bg-white/10 text-white px-6 py-2 rounded-full border border-white/10 transition-colors font-body text-sm font-semibold"
      >
        Lihat Semua Konser
      </Link>
    </div>
  )
}
