import Link from 'next/link'

export default function ConcertDetailNotFound() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center gap-4 px-6 py-12 text-center">
      <h1 className="text-4xl font-black">Konser tidak ditemukan</h1>
      <p className="max-w-xl text-zinc-400">Konser yang kamu cari tidak tersedia atau mungkin telah dibatalkan.</p>
      <Link href="/concerts" className="inline-flex items-center justify-center rounded-full bg-amber-400 px-6 py-3 text-sm font-semibold text-zinc-950 transition hover:bg-amber-500">
        Kembali ke daftar konser
      </Link>
    </main>
  )
}
