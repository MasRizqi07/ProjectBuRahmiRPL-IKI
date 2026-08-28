# War Ticket Platform

Production-oriented concert ticket marketplace for high-demand ticket drops.
The primary Vercel path is a Next.js fullstack vertical slice with authenticated
lazy admission, atomic Upstash Redis holds, durable PostgreSQL orders, and
signed Midtrans payment confirmation.

War Ticket is independent from War Event/BLACKBOX. The previous repository was
a UI prototype; the current codebase is a pnpm/Turborepo application with real
PostgreSQL, Redis, Supabase Auth, API, and worker boundaries.

## Architecture

```text
Browser
  -> apps/web (Next.js UI + authenticated Route Handlers on Vercel)
       -> Upstash Redis REST (queue, admission, inventory holds, idempotency)
       -> PostgreSQL (catalog, durable order/payment state)
  -> Vercel Cron (expiry safety net; not a correctness timer)
```

| Workspace | Responsibility |
| --- | --- |
| `apps/web` | Buyer UI, Supabase Auth session, versioned APIs |
| `apps/worker` | legacy v1 outbox/payment worker retained during migration |
| `packages/contracts` | runtime-validated Zod API/event contracts |
| `packages/domain` | price, inventory, order, reservation and payment rules |
| `packages/database` | tenant-safe transactions and repositories |
| `apps/web/lib/serverless-ticketing` | Upstash REST Lua scripts and lazy admission |
| `packages/redis` | legacy TCP Redis queue implementation |
| `packages/payments` | Midtrans Snap adapter, signature verification/status API |
| `packages/config` | fail-fast environment validation |
| `packages/observability` | structured, redacted logging |

The Vercel design is in
[`docs/architecture/serverless-checkout-engine.md`](docs/architecture/serverless-checkout-engine.md).
The earlier worker-based design remains documented in
[`docs/architecture/ticket-war-checkout-engine.md`](docs/architecture/ticket-war-checkout-engine.md)
for migration context.

## Implemented vertical slice

- One queue per sales session with authenticated, idempotent entry
- Lazy admission on status reads; no always-on queue scheduler
- Connectionless Upstash Redis REST client for Vercel functions
- Atomic reserve and idempotency result in the same Lua execution
- Idempotent hold completion/release and recoverable hold expiry indexes
- Cryptographic pre-queue shuffle and FIFO arrivals after opening
- Single-use, short-lived admission token
- General-admission counters and exact assigned-seat locks
- Server-authoritative IDR prices, fee snapshots and max-order enforcement
- Idempotent order/payment creation with transactional outbox
- Per-organizer Midtrans credentials encrypted using AES-256-GCM
- Verified and deduplicated Midtrans notifications
- Late-payment review path that never reclaims released inventory
- Batched expiry/release using `FOR UPDATE SKIP LOCKED`
- Minimal encrypted buyer PII; NIK is optional and consent-based
- Tenant keys, composite foreign keys, RLS and audit log foundations

## Prerequisites

- Node.js 22 or newer
- pnpm 9 (`corepack enable` if needed)
- PostgreSQL 15+ and an Upstash Redis database
- A Supabase project for Auth
- A Midtrans Sandbox merchant account for payment testing
- Docker Desktop is optional for the local PostgreSQL/Redis harness

## Local setup

1. Install dependencies and create the local environment file:

   ```bash
   pnpm install
   cp .env.example .env.local
   ```

   On Windows PowerShell, use `Copy-Item .env.example .env.local`.

2. Generate independent secrets of at least 32 random characters for
   `QUEUE_SIGNING_SECRET` and `CREDENTIAL_ENCRYPTION_KEY`. Never rotate the
   encryption key without a credential re-encryption procedure.

3. Set the Supabase URL, anon key and service-role key. Apply migrations
   `001_initial_schema.sql` through `004_legacy_order_hardening.sql` in numeric
   order, then `seed.sql`, to the database used by `DATABASE_URL`.

4. For a disposable PostgreSQL/Redis migration harness:

   ```bash
   pnpm infra:up
   ```

   This plain PostgreSQL container provides a minimal `auth.users` stub only
   for schema/integration testing. It does not replace Supabase Auth.

5. Copy the environment file into each runtime or inject the same variables
   through the process manager:

   ```bash
   cp .env.local apps/web/.env.local
   pnpm dev
   ```

   The Vercel checkout path runs entirely in `apps/web`. The legacy worker is
   still started by the root development command while the old `/api/v1`
   checkout endpoints remain available during migration.

## Configure an organizer's Midtrans Sandbox merchant

Set the `TENANT_ID` and `MIDTRANS_*` variables in the process environment, then
run:

```bash
pnpm merchant:configure
```

The server key is read from the environment, encrypted before persistence and
never printed. Start with `MIDTRANS_ENABLED=false`; enable it only after a
sandbox smoke test and webhook configuration. Point Midtrans notifications to:

```text
POST https://<public-host>/api/v1/payments/midtrans/webhook
```

## Quality gates

```bash
pnpm verify
```

This runs strict linting, TypeScript checks, unit/property tests and the
production build. No TypeScript or build errors are ignored.

The serverless checkout k6 gate models one 10,000-user drop against an event
with exactly 100 tickets. It requires 10,000 authenticated Supabase cookie
strings and a staging capacity of 10,000 so every virtual user can attempt the
same atomic reserve boundary:

```bash
k6 run \
  -e BASE_URL=https://staging.example.com \
  -e EVENT_ID=event-uuid \
  -e TIER_ID=tier-uuid \
  -e AUTH_COOKIES_JSON='["cookie-1", "cookie-2"]' \
  tests/load/serverless-reserve.js
```

Run load tests only against an isolated staging stack with production-like
PostgreSQL/Upstash limits. The gate is exactly 100 successful holds, exactly
9,900 sold-out responses, zero unexpected responses, no negative inventory,
and no duplicate order per idempotency key.

## Production deployment

Deploy `apps/web` to Vercel and configure the one-minute hold sweeper in
`apps/web/vercel.json`; this schedule requires Vercel Pro. Keep the legacy `apps/worker`
deployment only while `/api/v1` traffic is still enabled. Use managed
PostgreSQL with PITR and pooling, region-aligned Upstash Redis, TLS-only
connections, and a central secret manager. Run migrations as a one-off release
job before rolling out application code.

Required launch checks:

- tenant/RLS and cross-tenant security tests pass
- queue, Redis restart and database failover drills pass
- 3 × 10,000-user staging test meets the accepted SLO
- Midtrans sandbox create/status/webhook/expiry flows pass
- dashboards and alerts cover queue depth, admission rate, DB locks, outbox lag,
  expiry lag, webhook delay and invariant violations
- backups, PITR restore, credential rotation and incident runbooks are tested

## Complexity and trade-offs

- Queue join/status: `O(log n)` time and `O(n)` Redis storage per session.
- Pre-queue opening: `O(n log n)` once for deterministic ranking.
- GA reservation: `O(k)` for `k` requested ticket types.
- Assigned seats: `O(k log k)` lock ordering and `O(k)` rows.
- Checkout and webhook finalization: `O(k)` order items.

PostgreSQL row locks favor correctness over raw write throughput; admission
control bounds contention. Polling is easier to recover than sockets but costs
more requests. Organizer-owned merchant accounts improve fund isolation while
making onboarding and credential operations more complex.
