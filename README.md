# WAR TICKET

## Ringkasan Proyek

**WAR TICKET** adalah aplikasi frontend demo marketplace tiket konser Indonesia. Aplikasi ini dibangun menggunakan:

- **Next.js 16** (App Router)
- **React 19**
- **TypeScript**
- **Tailwind CSS 4**
- **Radix UI** sebagai basis komponen aksesibilitas

Aplikasi ini fokus pada pengalaman pengguna untuk mencari event, melihat detail tiket, dan mengelola halaman admin dasar. Struktur data saat ini bersifat statis, sehingga cocok sebagai prototipe desain dan review UI.

## Tujuan README

Dokumen ini dibuat untuk:

- mendeskripsikan arsitektur proyek secara lengkap
- memperjelas sistem desain dan struktur komponen
- menampilkan fitur, status data, dan area review
- menyediakan check & balance untuk analisis teknis

## Arsitektur Aplikasi

### Frontend

- `app/` — halaman aplikasi dengan App Router Next.js
- `components/` — komponen UI reusable dan presentasi
- `components/ui/` — wrapper komponen Radix dan utilitas desain
- `lib/` — logika data konser, helper formatting, dan filter
- `hooks/` — hook kustom untuk mobile detection dan toast management
- `styles/` — global stylesheet Tailwind dan CSS utilities

### Data Flow

Data konser dimuat dari `lib/concerts.ts` sebagai array statis `concerts`. Filter dan pencarian dikelola secara client-side melalui helper `filterConcerts()`.

- `concerts.ts` bertanggung jawab atas model data, fungsi filter, dan format IDR
- `app/concerts/page.tsx` adalah entry page daftar konser
- `app/concerts/[id]/page.tsx` merender detail event berdasarkan `id`

## Sistem Desain / Design System

### Foundation

- **Tailwind CSS 4** sebagai sistem utility-first
- **typography** dengan font `Inter` + `Space Grotesk`
- **tema** menggunakan class-based theming di `app/layout.tsx`
- **animasi** didefinisikan di `tailwind.config.ts` (`fade-up`, `scale-pulse`)

### Komponen Desain

- `Navbar` — navigasi utama
- `HeroContent` — hero section dengan CTA
- `InteractiveGrid` — background visual interaktif
- `StatCard` — statistik ringkas
- `ConcertCard`, `ConcertGrid` — daftar event responsif
- `SearchAndFilter` — pencarian dan filter event
- `TicketTierCard` — detail tier tiket
- `AdminSidebar` — sidebar dashboard admin

### UI Primitives

- `components/ui/` menyediakan komponen wrapper untuk:
  - tombol
  - input
  - dialog
  - select
  - table
  - badge
  - tooltip
  - toast

### Prinsip Desain

- konsistensi warna dan tipografi
- layout responsive mobile-first
- reusable component primitives untuk mempercepat iterasi
- akselerasi accessibility dengan Radix UI
- desain visual mempertahankan nuansa event / konser

## Fitur Utama

### Pengguna

- daftar konser dengan status tiket
- filter event berdasarkan kategori waktu, kota, dan ketersediaan
- halaman detail event dinamis
- tampilan tier tiket dengan harga dan perks
- pengalaman hero landing page dan statistik

### Admin

- halaman dashboard admin utama
- halaman `admin/concerts`, `admin/monitoring`, `admin/sales`, `admin/settings`
- layout admin scaffold untuk tampilan bisnis

### UI / UX

- navigasi responsif dan sticky
- animasi transisi ringan
- theme-friendly layout dark mode
- feedback toast untuk aksi
- page-level loading + not-found handling

## Struktur Halaman Utama

- `/` — homepage hero, statistik, dan sekilas event
- `/concerts` — katalog konser
- `/concerts/[id]` — detail konser
- `/admin` — halaman admin utama
- `/admin/concerts` — daftar konser admin
- `/admin/monitoring` — monitoring performa
- `/admin/sales` — laporan penjualan
- `/admin/settings` — pengaturan admin
- `/login` — login user
- `/register` — registrasi user
- `/my-tickets` — tiket milik user
- `/payment` — proses pembayaran
- `/order-confirmation` — konfirmasi order
- `/waiting-room` — ruang tunggu event

## Teknologi Utama

- `next` ^16.2.4
- `react` ^19
- `typescript` 5.7.3
- `tailwindcss` 4.2.0
- `@radix-ui/react-*`
- `next-auth` beta
- `react-hook-form`
- `framer-motion`
- `recharts`
- `sonner`
- `next-themes`
- `date-fns`
- `zod`

## Setup & Run

```bash
pnpm install
pnpm dev
```

Jika tidak punya `pnpm`:

```bash
corepack pnpm install
corepack pnpm dev
```

### Perintah penting

- `pnpm dev` — jalankan development server
- `pnpm build` — buat production build
- `pnpm start` — jalankan build production
- `pnpm lint` — jalankan linting

## Review Check & Balance

### 1. Data & Integrasi

- [ ] Data konser masih statis di `lib/concerts.ts`
- [ ] Perlu migrasi ke API / database untuk event dan tiket
- [ ] Belum ada persistence checkout / transaksi
- [ ] Belum ada backend auth yang terhubung nyata

### 2. Komponen & Desain Sistem

- [ ] Periksa konsistensi `components/ui/*` agar bisa digunakan ulang sepenuhnya
- [ ] Audit props type safety pada wrapper Radix
- [ ] Periksa kembali `tailwind.config.ts` dan class utilities untuk performa
- [ ] Pastikan spacing, warna, dan animasi sesuai design system

### 3. Aksesibilitas & UX

- [ ] Validasi label form dan `aria-*` di halaman `login`, `register`, `payment`
- [ ] Pastikan tombol dan link memiliki fokus keyboard yang jelas
- [ ] Periksa `alt` image pada semua kartu event
- [ ] Audit `aria-live` / toast notification untuk pengguna screen reader

### 4. Page Flow & Routing

- [ ] Evaluasi route admin agar hanya dapat diakses dengan auth
- [ ] Verifikasi fallback `not-found` dan `loading` page
- [ ] Pastikan data detail event tidak gagal ketika `id` tidak valid

### 5. Pengujian & Kualitas

- [ ] Tambahkan unit test untuk `concert-card`, `concert-grid`, `search-and-filter`
- [ ] Tambahkan integrasi test untuk flow `concerts -> detail -> payment`
- [ ] Tambahkan linting / formatting CI jika belum ada

## Kekuatan Proyek Saat Ini

- UI event-focused modern dan responsif
- Struktur Next.js App Router yang sudah benar
- Sistem desain berbasis Tailwind + Radix siap dikembangkan
- Data model tiket / tier sudah lengkap dan berkaitan
- Struktur halaman admin sudah tersedia sebagai foundation

## Rekomendasi Perbaikan Prioritas

1. Migrasi data `lib/concerts.ts` ke backend API
2. Implementasi autentikasi `next-auth` dengan session nyata
3. Tambahkan unit test + integrasi testing
4. Kembangkan sistem state global / cache untuk data event
5. Tambahkan deployment docs dan environment setup

## Catatan Khusus untuk Reviewer

- Fokus utama audit: `lib/concerts.ts`, `components/search-and-filter.tsx`, `components/concert-grid.tsx`, dan `app/concerts/[id]/page.tsx`
- Periksa apakah halaman admin hanya di-skeleton atau sudah memiliki logika access control
- Pastikan `tailwind` dan `Radix` wrapper tidak membuat duplikasi styling
- Validasi bahwa semua elemen UI dapat dirender dengan data event statis yang ada

---

> README ini dirancang sebagai dokumentasi teknis dan review checklist untuk project WAR TICKET. Gunakan sebagai acuan audit, pengembangan fitur, serta penyesuaian design system ke fase produksi.
