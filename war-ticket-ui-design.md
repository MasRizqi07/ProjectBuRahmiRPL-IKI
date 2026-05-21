# War Ticket - High-End Ticketing Platform UI/UX Specification

## 1. Design System & Brand Identity
*   **Theme:** Premium Dark Mode
*   **Core Palette:**
    *   Background: `#090909` (Deep Black)
    *   Primary/Accent: `#F0B429` (War Gold)
    *   Secondary Background: `#1A1A1A` (Dark Grey)
    *   Status Green: `#10B981` (Live Indicator)
    *   Status Red: `#EF4444` (Sold Out / High Demand)
*   **Typography:**
    *   Headlines: `Bebas Neue` (Bold, Energetic)
    *   Body/UI: `Plus Jakarta Sans` or `Inter` (Modern, Readable)
*   **Aesthetics:** Glassmorphism, Subtle Neon Glows, High-contrast Gold accents.

## 2. Screen Inventory & Component Breakdowns

### A. Landing Page (Desktop)
- **Hero Section:** Large 'WAR TICKET' title, dynamic search bar, live pulse indicator.
- **Stats Bar:** Displays tickets sold, active concerts, and system uptime.
- **Event Grid:** Glassmorphism cards with glow borders on hover.
- **Navigation:** Transparent sticky header with "Jelajahi", "Promo", "Cek Pesanan", and Profile Avatar.

### B. Concert Discovery & Filtering
- **Sidebar Filter:** Category (Rock, Pop, etc.), Date Range, Price Slider, Location.
- **Demand Meter:** A visual progress bar on each event card showing "Low", "Medium", or "High" demand.
- **City Chips:** Horizontal scrollable chips for quick location filtering.

### C. Live Queue (War Room)
- **Central Component:** Large animated progress circle (Gold) showing queue position.
- **Live Counters:** "Estimasi Waktu Tunggu" and "Antrian di Depan Anda".
- **Live Feed:** Real-time ticker showing "CAT 1 SOLD OUT", "VIP Limited".
- **Safety Message:** "Jangan Refresh Halaman Ini" (Alert styling).

### D. Seat Map & Ticket Selection
- **Interactive Map:** SVG-based zoomable venue map with color-coded sectors.
- **Selection Panel:** Right-side sticky panel with category pricing and availability bars.
- **Floating Summary:** Bottom bar showing "Selected: CAT 1 (2x) - Total: Rp 3.000.000".

### E. Express Checkout
- **Two-Column Layout:** 
    - Left: Payment Methods (QRIS, E-Wallet, Saved Cards) with large click areas.
    - Right: Order Summary + Countdown Timer (15:00 minutes).
- **CTA:** Large gold "Bayar Sekarang" button.

### F. E-Ticket & Confirmation
- **Ticket Card:** Glossy metallic texture, gold holographic seal, large QR Code.
- **Actions:** Download PDF, Save to Apple/Google Wallet, Share buttons.

### G. User Dashboard
- **Layout:** Vertical Sidebar + Main Content Grid.
- **Sections:** "Tiket Mendatang" (Active) and "Riwayat Konser" (Archived).
- **Gamification:** "War Level" badge based on purchase history.

### H. Promos & Deals
- **Banners:** High-energy neon glowing banners for "Early Bird" and "Bank Deals".
- **Flash Sale:** Card with integrated countdown timer for limited-time offers.

## 3. Responsive Behavior (Mobile)
- **Navigation:** Hamburger menu (Top-Right) + Sticky Bottom Navigation Bar.
- **Seat Map:** Pinch-to-zoom enabled with a swipeable Bottom Sheet for selection details.
- **Cards:** Single column layout with priority on Artist Image and 'Book' CTA.

## 4. Technical Implementation Notes for AI Agent
- **Framework Recommendation:** Next.js or React with Tailwind CSS.
- **Animations:** Use Framer Motion for the queue pulse and card hover effects.
- **Icons:** Lucide React or Phosphor Icons.
- **Components:** Headless UI or Radix UI for accessible modals and dropdowns.
Rekomendasi Langkah Selanjutnya untuk AI Agent Anda:
Setup Tailwind Config: Mintalah AI untuk membuat tailwind.config.js berdasarkan palet warna di atas.
Generate Component: Mulailah dengan meminta AI membuat "Reusable Concert Card with Glassmorphism effect".
Layouting: Minta AI membuat "Responsive Navigation bar with sticky behavior and gold accents".