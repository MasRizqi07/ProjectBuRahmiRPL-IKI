import { notFound } from 'next/navigation'

const documents = {
  terms: {
    title: 'Syarat dan Ketentuan',
    paragraphs: ['Akun digunakan untuk autentikasi antrean, pembelian, dan kepemilikan tiket.', 'Posisi pre-queue diacak secara terverifikasi sebelum penjualan dibuka; peserta berikutnya diproses FIFO.', 'Tiket hanya sah setelah pembayaran diverifikasi oleh provider dan status order menjadi PAID.'],
  },
  privacy: {
    title: 'Kebijakan Privasi',
    paragraphs: ['Data profil dipakai untuk layanan akun dan komunikasi yang disetujui.', 'NIK bersifat opsional per event, dienkripsi, membutuhkan consent eksplisit, dan dihapus setelah masa retensi.', 'QR tiket berumur pendek; token disimpan dalam bentuk hash dan tidak dapat dipakai ulang.'],
  },
  refund: {
    title: 'Kebijakan Refund',
    paragraphs: ['Refund hanya diproses berdasarkan aturan event dan status transaksi yang diverifikasi langsung ke provider.', 'Permintaan bersifat idempotent dan setiap keputusan dicatat dalam audit log.', 'Dana tidak dinyatakan dikembalikan sebelum provider mengonfirmasi hasil terminal.'],
  },
} as const

export default async function LegalPage({ params }: { readonly params: Promise<{ kind: string }> }) {
  const kind = (await params).kind as keyof typeof documents
  const document = documents[kind]
  if (!document) notFound()
  return <main id="main-content" className="container-shell max-w-3xl py-12"><span className="section-label">VERSI 2026-08-29</span><h1 className="mt-3 font-display text-5xl">{document.title}</h1><div className="mt-8 space-y-5 rounded-3xl border border-white/10 bg-[#141413] p-8 text-sm leading-7 text-muted-foreground">{document.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}</div></main>
}
