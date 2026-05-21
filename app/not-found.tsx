import Link from 'next/link'

export default function NotFound() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center gap-4 px-6 py-12 text-center">
      <h1 className="font-display text-4xl font-black">404 — Halaman tidak ditemukan</h1>
      <p className="max-w-xl text-zinc-400">Konser atau halaman yang kamu cari tidak ada. Coba kembali ke daftar konser atau beranda.</p>
      <Link href="/concerts" className="inline-flex items-center justify-center rounded-full bg-amber-400 px-6 py-3 text-sm font-semibold text-zinc-950 transition hover:bg-amber-500">
        Lihat semua konser
      </Link>
    </main>
  )
}
