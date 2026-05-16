# WAR TICKET

**WAR TICKET** adalah frontend demo marketplace tiket konser yang dibangun dengan **Next.js 16**, **React 19**, **TypeScript**, dan **Tailwind CSS 4**.

## Tujuan README

README ini dibuat untuk:

- Menjelaskan arsitektur aplikasi saat ini
- Menyampaikan area yang sudah tersedia dan area yang masih perlu pengembangan
- Menunjukkan status fitur, data, dan dependensi utama
- Memberi panduan bagi reviewer untuk melakukan audit dan perbaikan berikutnya

## Ringkasan Proyek

Aplikasi ini memiliki struktur halaman event dan user, dengan fokus pada:

- daftar konser dan detail event
- filter + pencarian frontend
- tampilan tiket dan status ketersediaan
- halaman admin dasar
- routing Next.js App Router
- penyimpanan data lokal untuk demo

Saat ini, data konser di-load secara statis dari `lib/concerts.ts`, dan sebagian besar logika bersifat presentasional. Ini cocok untuk prototipe UI, tetapi belum menjadi aplikasi produksi penuh.

## Stack Teknologi

- `next` ^16.2.4
- `react` ^19
- `typescript` 5.7.3
- `tailwindcss` 4.2.0
- `@radix-ui/react-*` untuk komponen aksesibilitas
- `react-hook-form` untuk form handling
- `framer-motion` untuk animasi UI
- `recharts` untuk visualisasi data
- `sonner` untuk toast notification
- `next-themes` untuk theme switching
- `date-fns` untuk manipulasi tanggal

## Struktur Utama

```bash
app/
  layout.tsx
  page.tsx
  admin/
  concerts/
    page.tsx
    [id]/
      page.tsx
  login/
  my-tickets/
  order-confirmation/
  payment/
  register/
  waiting-room/
components/
  admin-sidebar.tsx
  concert-card.tsx
  concert-card-skeleton.tsx
  concert-grid.tsx
  navbar.tsx
  search-and-filter.tsx
  ticket-tier-card.tsx
  theme-provider.tsx
  ui/               # wrapper Radix / reusable UI components
lib/
  concerts.ts       # data konser statis + helper filter
hooks/
  use-mobile.ts
  use-toast.ts
public/
styles/
  globals.css
```

## Halaman yang Ada

- `/` — homepage
- `/concerts` — daftar konser
- `/concerts/[id]` — detail konser dinamis
- `/admin` — dashboard admin
- `/admin/concerts` — daftar konser admin
- `/admin/monitoring` — monitoring
- `/admin/sales` — laporan penjualan
- `/admin/settings` — pengaturan admin
- `/login` — halaman login
- `/register` — halaman registrasi
- `/my-tickets` — tiket pengguna
- `/payment` — proses pembayaran
- `/order-confirmation` — konfirmasi pesanan
- `/waiting-room` — ruang tunggu event

## Fitur Tersedia

- daftar konser berbasis data statis
- pencarian teks pada halaman `/concerts`
- tombol filter frontend dengan kategori dasar
- tampilan kartu konser dan tier harga
- halaman detail konser dinamis
- halaman loading, error, dan not-found sederhana
- proteksi route admin/membatasi akses (middleware skeleton)
- wrapper UI berbasis Radix untuk komponen umum

## Area yang Perlu Ditingkatkan

### 1. Data & Backend

- `lib/concerts.ts` masih statis; butuh API yang nyata atau backend server
- belum ada integrasi data event, tiket, atau transaksi yang tersimpan
- halaman admin tidak terhubung ke backend nyata

### 2. Form & Validasi

- halaman register belum sepenuhnya valid secara aksesibilitas
- validasi saat ini hanya di frontend
- belum ada implementasi autentikasi penuh / otorisasi user

### 3. Filter dan Pencarian

- filter `this-week`, `this-month`, `by-city` harus divalidasi kembali
- beberapa filter saat ini mungkin hanya tampilan, bukan logika bisnis lengkap

### 4. Aksesibilitas & ARIA

- perbaikan ARIA sudah berjalan pada beberapa komponen, tetapi audit perlu dilanjutkan
- pastikan elemen role grid dan tombol ARIA valid di seluruh UI
- tambahkan label form yang konsisten dan error handling berbasis `aria-describedby`

### 5. State Management

- aplikasi masih bergantung pada state lokal komponen
- jika data event menjadi dinamis, perlu arsitektur global state / cache (misalnya React Query, Zustand)

### 6. Testing

- belum terlihat paket testing (`jest`, `vitest`, `cypress`)
- perlu tes unit dan integrasi untuk komponen utama + halaman

### 7. Produksi & Infrastruktur

- belum ada konfigurasi environment variable jelas untuk NextAuth atau API
- belum ada strategi deployment atau preview environment
- belum ada monitoring error / logging tersentralisasi

## Proses Setup

```bash
pnpm install
pnpm dev
```

Jika `pnpm` tidak tersedia:

```bash
corepack pnpm install
corepack pnpm dev
```

## Perintah Penting

- `pnpm dev` — jalankan development server
- `pnpm build` — buat production build
- `pnpm start` — jalankan server Next.js hasil build
- `pnpm lint` — jalankan ESLint

## Dependensi Utama

- `next`
- `react`
- `react-dom`
- `tailwindcss`
- `@radix-ui/react-*`
- `next-auth`
- `react-hook-form`
- `framer-motion`
- `recharts`
- `sonner`
- `date-fns`
- `zod`

## Pengamatan Audit

1. `lib/concerts.ts` adalah sumber data utama saat ini. Untuk produksi, data ini harus dipindahkan ke API atau database.
2. `components/concert-grid.tsx` menggunakan struktur grid custom; sebaiknya audit role/ARIA untuk kompatibilitas aksesibilitas.
3. `app/concerts/page.tsx` dan `components/search-and-filter.tsx` adalah titik utama untuk logika pencarian/filter.
4. `components/ui` berisi wrapper Radix; waspadai prop type mismatch saat memperketat konfigurasi TypeScript.
5. `app/register/page.tsx` memiliki beberapa field `aria-invalid` yang sempat terdeteksi invalid; pastikan nilai string yang valid digunakan.

## Rekomendasi Jangka Pendek

- Tambahkan API mock atau backend sederhana untuk konser
- Tambahkan validasi form berbasis `zod`
- Tambahkan testing unit untuk komponen `concert-card`, `concert-grid`, dan `search-and-filter`
- Periksa kembali halaman admin terhadap otentikasi dan akses kontrol
- Refactor `lib/concerts.ts` ke `data/` atau service dengan model typed

## Rekomendasi Jangka Menengah

- Implementasi NextAuth penuh dengan session management
- Tambahkan state management atau query layer untuk data event/tiket
- Tambahkan deployment readiness: env vars, production config, analytics
- Audit aksesibilitas penuh dengan Axe atau Lighthouse

---

Jika kamu ingin, saya bisa juga menambahkan:

- checklist per halaman untuk review QA
- breakdown area yang perlu dibuat issue/task
- diagram dependency arsitektur frontend
