# WAR TICKET

**WAR TICKET** adalah aplikasi frontend marketplace tiket konser yang dibangun dengan **Next.js 16**, **React 19**, **TypeScript**, dan **Tailwind CSS**.

## Deskripsi

Aplikasi ini menampilkan daftar konser Indonesia dan internasional dengan fitur pencarian, filter, dan tampilan kartu konser. Data konser disimpan secara lokal pada `lib/concerts.ts` sehingga digunakan untuk demo dan audit logika tampilan.

## Fitur Utama

- Halaman konser dengan pencarian dan filter sederhana
- Daftar konser statis dengan informasi tiket, harga, dan ketersediaan
- Struktur halaman admin dan halaman pengguna pendukung
- Komponen UI berbasis Tailwind CSS dan Radix/UI
- Integrasi font Google melalui Next.js

## Teknologi

- Next.js 16
- React 19
- TypeScript
- Tailwind CSS 4
- Radix UI (`@radix-ui/react-*`)
- `react-hook-form`
- `framer-motion`
- `recharts`
- `sonner` (toasts)
- `next-themes`
- `date-fns`

## Struktur Proyek

```
app/
  layout.tsx              # Root layout global aplikasi
  page.tsx                # Halaman utama (home)
  admin/                  # Halaman admin
  concerts/               # Halaman listing konser
  login/                  # Halaman login
  my-tickets/             # Halaman tiket pengguna
  order-confirmation/     # Halaman konfirmasi pesanan
  payment/                # Halaman pembayaran
  register/               # Halaman registrasi
  waiting-room/           # Halaman ruang tunggu
components/
  navbar.tsx              # Navigasi utama
  concert-card.tsx        # Komponen kartu konser
  concert-grid.tsx        # Tampilan grid daftar konser
  search-and-filter.tsx   # Pencarian dan filter
  ticket-tier-card.tsx    # Kartu tier tiket
  admin-sidebar.tsx       # Sidebar admin
  theme-provider.tsx      # Provider tema dan mode gelap
  ui/                     # Komponen UI berbasis Radix dan utilitas
lib/
  concerts.ts             # Model data konser, utility format, helper
public/                   # Asset statis
styles/                   # Styling global tambahan

```

## Halaman Utama dan Route

- `/` — Beranda
- `/concerts` — Daftar konser dengan pencarian dan filter
- `/admin` — Halaman admin
- `/admin/concerts` — Panel konser admin
- `/admin/monitoring` — Monitoring admin
- `/admin/sales` — Laporan penjualan
- `/admin/settings` — Pengaturan admin
- `/login` — Halaman login
- `/register` — Halaman registrasi
- `/my-tickets` — Halaman tiket pengguna
- `/payment` — Proses pembayaran
- `/order-confirmation` — Konfirmasi pesanan
- `/waiting-room` — Ruang tunggu event

## Data dan Logika Utama

File `lib/concerts.ts` memuat:

- definisi tipe `Concert` dan `TicketTier`
- daftar `concerts` statis
- utilitas `formatCurrency`, `getAvailabilityLabel`, `getAvailabilityColor`
- helper `getConcertById`

Di `app/concerts/page.tsx`, halaman menggunakan:

- state `searchQuery` dan `activeFilter`
- `useMemo` untuk menyaring daftar konser berdasarkan input pencarian
- komponen `Navbar`, `SearchAndFilter`, dan `ConcertGrid`

## Setup dan Menjalankan

Jalankan perintah berikut di akar proyek:

```bash
pnpm install
pnpm dev
```

Atau jika menggunakan npm / yarn, sesuaikan perintahnya:

```bash
npm install
npm run dev
```

## Build

```bash
pnpm build
```

## Catatan Audit

- Data konser tidak berasal dari API eksternal; `lib/concerts.ts` adalah sumber data utama
- Logika filter saat ini placeholder: filter `this-week`, `this-month`, dan `by-city` belum menerapkan pemfilteran nyata
- Halaman admin dan user kemungkinan masih berupa tampilan statis / demo karena tidak ada API backend yang terlihat dalam struktur saat ini

## Rekomendasi Analisis

1. Telaah `app/concerts/page.tsx` untuk alur data daftar konser.
2. Periksa `components/concert-card.tsx` dan `components/concert-grid.tsx` untuk detail tampilan tiket dan status.
3. Lihat `components/search-and-filter.tsx` untuk implementasi UI filter.
4. Pantau integrasi tema dan font di `app/layout.tsx` dan `components/theme-provider.tsx`.

---

Jika kamu ingin, saya juga bisa tambahkan diagram alur folder dan dependensi yang lebih rinci untuk audit kamu.