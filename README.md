# War Ticket Platform

Production-oriented multi-tenant concert ticket marketplace for high-demand
ticket drops. This repository contains the first vertical slice: authenticated
waiting room, fair queue admission, atomic inventory reservation, checkout,
and organizer-scoped Midtrans payment orchestration.

War Ticket is independent from War Event/BLACKBOX. The previous repository was
a UI prototype; the current codebase is a pnpm/Turborepo application with real
PostgreSQL, Redis, Supabase Auth, API, and worker boundaries.

## Architecture

```text
Browser
  -> apps/web (Next.js UI + authenticated HTTP API)
       -> PostgreSQL (authoritative inventory/orders/payments)
       -> Redis (queue/admission traffic-control plane)
  -> apps/worker (queue scheduler, outbox, Midtrans, expiry)
```

| Workspace | Responsibility |
| --- | --- |
| `apps/web` | Buyer UI, Supabase Auth session, versioned APIs |
| `apps/worker` | queue lifecycle, admission, outbox, payment and expiry jobs |
| `packages/contracts` | runtime-validated Zod API/event contracts |
| `packages/domain` | price, inventory, order, reservation and payment rules |
| `packages/database` | tenant-safe transactions and repositories |
| `packages/redis` | atomic queue/admission Lua operations and signed tokens |
| `packages/payments` | Midtrans Snap adapter, signature verification/status API |
| `packages/config` | fail-fast environment validation |
| `packages/observability` | structured, redacted logging |

The complete accepted design is in
[`docs/architecture/ticket-war-checkout-engine.md`](docs/architecture/ticket-war-checkout-engine.md).

## Implemented vertical slice

- One queue per sales session with authenticated, idempotent entry
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
- PostgreSQL 15+ and Redis 7+
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
   `001_initial_schema.sql` and `002_ticketing_engine.sql`, then `seed.sql`, to
   the database used by `DATABASE_URL`.

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

   Turborepo starts the Next.js application and worker together. The worker
   must be running for queue opening, admissions, payment initiation and hold
   expiry.

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

The k6 queue test models three simultaneous drops and requires 10,000 unique
authenticated Supabase cookie strings:

```bash
k6 run \
  -e BASE_URL=https://staging.example.com \
  -e SALES_SESSION_IDS=id-1,id-2,id-3 \
  -e AUTH_COOKIES_JSON='["cookie-1", "cookie-2"]' \
  tests/load/queue.js
```

Run load tests only against an isolated staging stack with production-like
PostgreSQL/Redis limits. The release threshold is no oversell, less than 1%
failed requests and p95 under 500 ms for admitted checkout APIs.

## Production deployment

Deploy `apps/web` and `apps/worker` as separate processes from the same commit.
Use managed PostgreSQL with PITR and connection pooling, Redis with persistence
and `noeviction`, at least two worker replicas, TLS-only connections and a
central secret manager. Run migrations as a one-off release job before rolling
out application processes.

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
