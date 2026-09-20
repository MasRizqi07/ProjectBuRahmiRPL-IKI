# 📡 War Ticket Platform — API Specification & Route Handlers Reference

> **Dokumentasi Lengkap Antarmuka Pemrograman Aplikasi (API)**  
> *Target Evaluasi: Integrator Sistem, Penguji API, dan Pengembang Frontend/Mobile.*

---

## 1. Konvensi & Standar API

Seluruh Route Handlers pada War Ticket Platform dirancang mengikuti standar RESTful dengan validasi skema runtime ketat berbasis **Zod** (`@war-ticket/contracts`):

- **Format Data**: `application/json` (UTF-8).
- **Protokol**: HTTPS / TLS 1.3.
- **Autentikasi**: Menggunakan Bearer Token (Supabase JWT) via cookie sesi peramban atau header `Authorization: Bearer <token>`.
- **Format Respons Sukses Terstandar**:
  ```json
  {
    "success": true,
    "data": { ... },
    "meta": { "timestamp": "2026-09-21T00:30:00.000Z" }
  }
  ```
- **Format Respons Error Terstandar (RFC 7807 Pattern)**:
  ```json
  {
    "error": "Pesan deskripsi kesalahan yang ramah pengguna.",
    "code": "ERR_INVENTORY_EXHAUSTED",
    "details": {}
  }
  ```

---

## 2. Katalog Endpoint Pembeli (Buyer & Public)

### 2.1 Pendaftaran Antrean Konser (`join-queue`)
Mendaftarkan pembeli yang terautentikasi ke dalam virtual waiting room suatu event.

- **Metode**: `POST`
- **Path**: `/api/events/[eventId]/join-queue`
- **Autentikasi**: Diperlukan (Buyer Role)
- **Headers**: `Idempotency-Key: <uuid>` (Opsional namun disarankan)
- **Respons Sukses (200 OK)**:
  ```json
  {
    "status": "QUEUED",
    "position": 142,
    "estimatedWaitSeconds": 45,
    "joinedAt": "2026-09-21T10:00:02.120Z"
  }
  ```
- **Respons Error**:
  - `401 Unauthorized`: Belum melakukan login.
  - `404 Not Found`: Event konser tidak ditemukan atau belum dibuka.

---

### 2.2 Pengecekan Status Antrean (`queue-status`)
Melakukan polling status antrean dan memicu evaluasi *Lazy Admission*.

- **Metode**: `GET`
- **Path**: `/api/events/[eventId]/queue-status`
- **Autentikasi**: Diperlukan
- **Respons Sukses — Masih Mengantre (200 OK)**:
  ```json
  {
    "status": "QUEUED",
    "position": 12,
    "estimatedWaitSeconds": 10
  }
  ```
- **Respons Sukses — Lolos Antrean (200 OK)**:
  ```json
  {
    "status": "ADMITTED",
    "admissionToken": "eyJhbGciOiJIUzI1NiIsIn...",
    "expiresAt": "2026-09-21T10:05:00.000Z"
  }
  ```

---

### 2.3 Reservasi Penahanan Tiket (`reservations`)
Mengeksekusi reservasi kuota tiket (Hold) secara atomik di Redis dengan durasi 10 menit.

- **Metode**: `POST`
- **Path**: `/api/reservations`
- **Autentikasi**: Diperlukan
- **Request Body**:
  ```json
  {
    "eventId": "9042d923-afe0-4035-8bf7-fe97d2b446ef",
    "tierId": "bca6a8d4-d451-4072-8b9c-396810c1f458",
    "quantity": 2,
    "admissionToken": "eyJhbGciOiJIUzI1NiIsIn..."
  }
  ```
- **Respons Sukses (201 Created)**:
  ```json
  {
    "reservationId": "res_8f912a7c4e20",
    "status": "HELD",
    "quantity": 2,
    "unitPrice": 1500000,
    "totalPrice": 3000000,
    "expiresAt": "2026-09-21T10:15:00.000Z"
  }
  ```
- **Respons Error**:
  - `400 Bad Request`: Token antrean tidak valid atau sudah kedaluwarsa.
  - `409 Conflict`: Kuota kategori tiket ini telah habis (*Sold Out*).

---

### 2.4 Permintaan Pembayaran Snap (`orders/[orderId]/payment`)
Menerbitkan sesi transaksi Midtrans Snap untuk pesanan tiket yang memiliki reservasi aktif.

- **Metode**: `POST`
- **Path**: `/api/v1/orders/[orderId]/payment`
- **Autentikasi**: Diperlukan
- **Respons Sukses (200 OK)**:
  ```json
  {
    "token": "snap-token-8921734-abc",
    "redirectUrl": "https://app.sandbox.midtrans.com/snap/v2/vtweb/snap-token-8921734-abc"
  }
  ```

---

### 2.5 Daftar Tiket Pembeli (`me/tickets`)
Mengambil seluruh koleksi tiket milik akun pengguna saat ini.

- **Metode**: `GET`
- **Path**: `/api/me/tickets`
- **Autentikasi**: Diperlukan
- **Respons Sukses (200 OK)**:
  ```json
  {
    "tickets": [
      {
        "id": "tkt_01j7k49a8...",
        "orderId": "ord_91823...",
        "ticketCode": "WT-COLDPLAY-VIP-0012",
        "status": "ACTIVE",
        "eventTitle": "Coldplay Music of the Spheres Jakarta",
        "startsAt": "2026-11-15T19:00:00.000Z",
        "label": "VIP Lounge Category 1",
        "price": 3500000
      }
    ]
  }
  ```

---

### 2.6 Dynamic Rotating QR Code (`tickets/[ticketId]/qr`)
Menghasilkan payload QR code digital yang berputar setiap 30 detik untuk pencegahan screenshot.

- **Metode**: `POST`
- **Path**: `/api/tickets/[ticketId]/qr`
- **Autentikasi**: Diperlukan (Harus pemilik tiket sah)
- **Respons Sukses (200 OK)**:
  ```json
  {
    "imageDataUrl": "data:image/png;base64,iVBORw0KGgoAAAANSUh...",
    "expiresAt": "2026-09-21T10:30:30.000Z"
  }
  ```

---

## 3. Katalog Endpoint Promotor (Organizer)

### 3.1 Ringkasan Operasional & Penjualan (`organizer/reports/sales`)
Mengambil agregasi penjualan tiket per konser.

- **Metode**: `GET`
- **Path**: `/api/organizer/reports/sales?eventId=<uuid>`
- **Autentikasi**: Diperlukan (Organizer / Tenant Role)
- **Respons Sukses (200 OK)**:
  ```json
  {
    "totalTicketsSold": 1420,
    "grossRevenue": 2130000000,
    "netRevenue": 2023500000,
    "occupancyRate": 0.946,
    "salesVelocityPerMinute": 85.4
  }
  ```

### 3.2 Pembuatan Draft Konser Baru (`organizer/drafts`)
Menyimpan rancangan konser baru beserta denah kursi dan tier harga.

- **Metode**: `POST`
- **Path**: `/api/organizer/drafts`
- **Autentikasi**: Diperlukan (Organizer Role)
- **Request Body**:
  ```json
  {
    "title": "Ed Sheeran Mathematics Tour 2026",
    "venueName": "Stadion Utama Gelora Bung Karno",
    "eventDate": "2026-12-01T20:00:00.000Z",
    "tiers": [
      { "name": "CAT 1", "capacity": 5000, "price": 1800000 },
      { "name": "Festival A", "capacity": 10000, "price": 1200000 }
    ]
  }
  ```

---

## 4. Katalog Endpoint Tata Kelola Administrator (Platform Admin)

### 4.1 Log Audit Sistem Forensik (`admin/audit`)
Mengambil jejak audit seluruh peristiwa sensitif sistem dengan filter multi-parameter.

- **Metode**: `GET`
- **Path**: `/api/admin/audit?limit=50&action=PRICE_MODIFIED`
- **Autentikasi**: Diperlukan (Platform Admin Role)
- **Respons Sukses (200 OK)**:
  ```json
  {
    "logs": [
      {
        "id": "log_891238...",
        "actorId": "usr_admin_01",
        "action": "PRICE_MODIFIED",
        "targetEntity": "tier_bca6a...",
        "ipAddress": "180.252.11.90",
        "userAgent": "Mozilla/5.0 ...",
        "createdAt": "2026-09-20T14:10:00.000Z"
      }
    ]
  }
  ```

### 4.2 Resolusi Sengketa & Refund Tiket (`admin/disputes/[disputeId]/refund`)
Otorisasi pengembalian dana tiket akibat pembatalan atau kendala sistem.

- **Metode**: `POST`
- **Path**: `/api/admin/disputes/[disputeId]/refund`
- **Autentikasi**: Diperlukan (Platform Admin Role)
- **Request Body**:
  ```json
  {
    "approvalReason": "Sengketa double-charge tervalidasi via Midtrans audit log.",
    "refundAmount": 1500000
  }
  ```

---

## 5. Endpoint Integrasi, Webhook & Operasional

### 5.1 Webhook Notifikasi Pembayaran Midtrans
Menerima notifikasi status transaksi dari server Midtrans.

- **Metode**: `POST`
- **Path**: `/api/payments/midtrans/webhook`
- **Autentikasi**: Verifikasi Tanda Tangan Kriptografis (`signature_key`)
- **Request Body**: Format standar notifikasi HTTP Midtrans Snap.
- **Respons Sukses (200 OK)**:
  ```json
  { "accepted": true }
  ```
- **Respons Ditolak (403 Forbidden)**: Signature key palsu atau tidak sesuai dengan perhitungan server.

---

### 5.2 Pemindaian & Penebusan Tiket di Lokasi (`scanner/redeem`)
Memvalidasi e-tiket pengunjung di gerbang masuk venue.

- **Metode**: `POST`
- **Path**: `/api/scanner/redeem`
- **Autentikasi**: Diperlukan (Staff / Scanner Role)
- **Request Body**:
  ```json
  {
    "qrPayload": "signed_totp_encrypted_string...",
    "gateName": "Gate 3 - VIP West"
  }
  ```
- **Respons Sukses (200 OK)**:
  ```json
  {
    "status": "VALID",
    "ticketCode": "WT-COLDPLAY-VIP-0012",
    "tierName": "VIP 1",
    "holderName": "Rizqi Pratama",
    "redeemedAt": "2026-11-15T18:15:22.000Z"
  }
  ```
- **Respons Gagal (409 Conflict)**: Tiket sudah pernah dipindai sebelumnya (*Already Redeemed*).

---

### 5.3 Pembersihan Hold Kedaluwarsa (`cron/sweep-holds`)
Dijalankan secara otomatis oleh Vercel Cron setiap 1 menit sebagai jaring pengaman (*safety net*).

- **Metode**: `GET`
- **Path**: `/api/cron/sweep-holds`
- **Autentikasi**: Header `Authorization: Bearer <CRON_SECRET>`
- **Respons Sukses (200 OK)**:
  ```json
  {
    "sweptCount": 14,
    "restoredInventory": 28,
    "durationMs": 145
  }
  ```

---

## 6. Tabel Kode Kesalahan Standar (Dictionary Error Codes)

| Kode Kesalahan | HTTP Status | Penjelasan Teknis |
| :--- | :---: | :--- |
| `ERR_UNAUTHORIZED` | 401 | Sesi autentikasi Supabase tidak ditemukan atau sudah kedaluwarsa. |
| `ERR_FORBIDDEN_ROLE` | 403 | Akun tidak memiliki peran akses yang sesuai (misal: Buyer membuka rute Admin). |
| `ERR_INVALID_ADMISSION_TOKEN` | 400 | Token antrean tidak sah, sudah pernah digunakan, atau dipalsukan. |
| `ERR_SOLD_OUT` | 409 | Kapasitas tiket kategori yang dipilih sudah 0. |
| `ERR_HOLD_EXPIRED` | 410 | Batas waktu 10 menit untuk menyelesaikan pembayaran telah habis. |
| `ERR_INVALID_WEBHOOK_SIGNATURE` | 403 | Tanda tangan SHA-512 dari Midtrans tidak cocok dengan Server Key. |
| `ERR_TICKET_ALREADY_REDEEMED` | 409 | Tiket sudah berhasil dipindai sebelumnya pada gerbang masuk. |
```

