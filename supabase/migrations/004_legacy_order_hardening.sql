-- The original prototype allowed authenticated clients to insert directly
-- into public.orders. That bypasses reservations, server-authoritative prices,
-- inventory locking, idempotency, and payment state transitions.
drop policy if exists "Users can create orders" on public.orders;

revoke insert, update, delete, truncate, references, trigger
  on table public.orders
  from anon, authenticated;

-- Checkout creation is exclusively available through the server-side
-- ticketing checkout repositories, which use DATABASE_URL and never expose
-- database credentials to the browser.
