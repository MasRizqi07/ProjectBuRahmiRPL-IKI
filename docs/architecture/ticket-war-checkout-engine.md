# War Ticket Checkout Engine Architecture

Status: Accepted for implementation  
Last updated: 2026-08-27  
Owner: War Ticket

## 1. Understanding

- War Ticket is a multi-tenant Indonesian concert-ticket marketplace and is
  independent from War Event/BLACKBOX.
- The first production vertical slice is the Ticket War/Checkout Engine:
  authenticated waiting room, admission control, inventory reservation,
  checkout, Midtrans Sandbox payment, webhook processing, and order state.
- Version one supports both pooled general-admission inventory and exact
  assigned-seat inventory.
- A sales session owns its queue. Users present before opening are shuffled;
  users arriving after opening are appended FIFO.
- Authentication is required before queue entry, with one active entry per
  account and sales session.
- The system targets 10,000 concurrent users per sales session and three
  simultaneous high-demand sessions.
- Organizers are the merchants. The platform orchestrates checkout and records
  its service fee without acting as merchant of record.

## 2. Scope

### In scope

- Supabase Auth as the single identity provider
- Tenant-safe sales-session configuration
- Auditable pre-queue shuffle and post-open FIFO queueing
- Adaptive checkout admission
- General-admission and assigned-seat holds
- Server-authoritative pricing and order creation
- Midtrans Sandbox adapter with tenant-isolated credentials
- Idempotent notifications, expiry, retry, and reconciliation
- Operational telemetry and concurrency/load test foundations

### Deferred

- Self-service promoter onboarding and complete event CRUD
- Production merchant onboarding and automated organizer settlement
- Refund automation and chargeback operations
- Ticket generation/delivery and wallet passes
- Complete buyer, organizer, and platform-admin applications
- Dynamic pricing and multi-event shopping carts

Internal seed/configuration mechanisms may supply tenant, venue, event, seat,
and sales-session data while those product surfaces are deferred.

## 3. Non-functional requirements

| Requirement | Acceptance target |
| --- | --- |
| Queue load | 10,000 users/session; 3 simultaneous sessions |
| Inventory safety | No paid/confirmed quantity above sellable capacity |
| Checkout latency | p95 <= 500 ms for admitted API requests |
| Availability | 99.9% during configured sales windows |
| Durability | No loss of committed order/payment state |
| Tenant isolation | No cross-tenant read or mutation |
| Payment processing | At-least-once input; exactly-once business effect |
| Recovery | PostgreSQL PITR; reconstructible Redis queue state |

## 4. System boundaries

The repository is a Turborepo with the following target boundaries:

```text
apps/
  web/             Next.js user interface and HTTP API
  worker/          outbox, expiry, payment, and reconciliation jobs
packages/
  domain/          framework-independent business rules
  database/        schema, transactions, and repositories
  redis/           queue, admission, rate limiting, ephemeral state
  contracts/       Zod request/response and event contracts
  config/          validated environment configuration
  observability/   logs, metrics, tracing, and redaction
```

PostgreSQL is authoritative for tenants, catalog configuration, inventory,
reservations, orders, payments, idempotency, inbox/outbox, and audits. Redis is
the traffic-control plane. Redis loss may interrupt admission but cannot change
which tickets are sold.

The web app authenticates, validates, authorizes, and invokes application
services. It does not contain inventory or payment state machines in React or
route handlers. The worker owns retryable asynchronous effects.

## 5. Identity and tenant isolation

Supabase Auth is the sole identity provider. The prototype NextAuth credentials
provider and hardcoded users are removed. Application identity is represented
by `profiles`; organizer access is represented by explicit tenant memberships.

Every tenant-owned row contains `tenant_id`. Composite keys and foreign keys
prevent objects from different tenants from being associated. PostgreSQL RLS is
defense in depth; server-side authorization remains mandatory.

Payment provider credentials are encrypted at rest and only unwrapped in a
server/worker runtime. Secret values and buyer PII are redacted from telemetry.

## 6. Inventory model

General-admission inventory uses an inventory-pool row containing capacity,
held quantity, and sold quantity. A reservation transaction locks the row,
checks `capacity - held - sold`, increments held quantity, and inserts the
reservation item atomically.

Assigned seating materializes venue seats as event seats. Requested seat rows
are locked in stable identifier order. All selected seats must be available;
otherwise the transaction rolls back. Unique constraints and conditional
updates form the final oversell barrier.

```text
HELD -> CHECKOUT_PENDING -> CONFIRMED
  |             |
  +-----------> EXPIRED / RELEASED
```

Orders, reservations, and payments are distinct state machines. Price, fee,
tax, ticket name, and seat label are immutable order snapshots calculated by
the server. Currency values use integer minor units.

## 7. Queue and admission

Each sales session has an isolated Redis namespace. An authenticated user gets
one signed queue ticket for the session. Multiple tabs/devices return the same
entry rather than creating new positions.

At opening, the pre-queue cohort is frozen and ranked deterministically from a
cryptographically secure seed. A commitment hash is recorded before ranking so
the operation is auditable. Later arrivals receive monotonic FIFO sequence
values after the shuffled cohort.

Admission is adaptive. It observes active reservations, checkout latency and
error rate, PostgreSQL pressure, and payment-provider health. An admitted user
receives a short-lived, single-use token. Issuance and consumption are atomic
Redis operations. Queue status uses adaptive polling with jitter.

## 8. Checkout and payment

`POST /checkout` requires an authenticated user, admission token, reservation
identifier, and idempotency key. A database transaction verifies ownership and
expiry, recomputes totals, and creates the order, order items, payment attempt,
idempotency result, and outbox message.

The API responds without waiting for a remote payment call. The worker creates
the Midtrans transaction using the organizer's credential and the stable
provider order identifier. The client polls the payment-attempt resource until
a token/redirect is available.

Midtrans notifications are stored before processing, deduplicated, signature
checked, and mapped through an allowlisted state transition. Important or
ambiguous states are challenged through the Get Status API. Duplicate and
out-of-order notifications have no duplicate business effect.

A payment received after inventory release does not silently reclaim the seat.
It becomes `PAYMENT_REVIEW_REQUIRED` for reconciliation/refund handling.

Midtrans references:

- [Account and access-key isolation](https://docs.midtrans.com/docs/midtrans-account)
- [Merchant and partner accounts](https://docs.midtrans.com/docs/difference-between-merchant-account-and-partner-account)
- [Notification security](https://docs.midtrans.com/reference/handle-notifications)
- [Get transaction status](https://docs.midtrans.com/reference/get-transaction-status)

Production partner onboarding and platform-fee mechanics require commercial
confirmation with Midtrans; sandbox implementation does not imply approval.

## 9. Failure model

| Failure | Required behavior |
| --- | --- |
| Redis unavailable | Pause join/admission; preserve DB checkout state |
| PostgreSQL unavailable | Pause reservations/checkouts; do not infer stock |
| Worker unavailable | Retain committed outbox work and alert on lag |
| Midtrans timeout | Reconcile the same provider order ID; never duplicate |
| Client disconnect | Resume from authoritative queue/reservation/order state |
| Duplicate request | Return the stored idempotent outcome |
| Duplicate webhook | Store/dedupe event; apply at most one transition |
| Late successful payment | Flag for review; never reclaim released inventory |

All deadlines use server/database UTC. Capacity cannot be reduced below held
plus sold inventory. State transitions use explicit allowlists.

## 10. Security and privacy

- Least-privilege tenant authorization and RLS
- Encrypted tenant payment credentials and rotation support
- CSRF protection, secure cookies/headers, and strict Zod validation
- Per-account, IP, and risk-based rate limits
- Replay-resistant queue/admission tokens
- Webhook signature verification and provider challenge
- Append-only audit records for sensitive state changes
- Minimal buyer PII; NIK is event-specific, consented, encrypted, access logged,
  and retained for a bounded period
- No card or bank-account credential storage

## 11. Observability

Structured logs, traces, and metrics cover request rate/error/duration, queue
depth and admission, Redis latency, database lock time, active reservations,
expiry lag, outbox lag, webhook delay, payment reconciliation, and the oversell
invariant. High-cardinality user identifiers and raw PII are excluded.

## 12. Verification strategy

- Unit tests for state machines, price calculation, token validation, and queue
  ranking
- Property tests for random reserve/expire/pay/cancel sequences
- PostgreSQL/Redis integration tests for concurrency and idempotency
- Midtrans contract fixtures plus sandbox smoke tests
- Playwright end-to-end tests for the buyer flow
- Load tests for three 10,000-user sessions
- Recovery tests for Redis/worker restarts, provider timeouts, delayed webhook,
  and disconnected clients
- Security tests for tenant isolation, RLS, token replay, forged webhook,
  privilege escalation, and telemetry leakage

Release is blocked by any oversell, duplicate order/payment, cross-tenant
access, lost committed transaction, or failure of the accepted load SLO.

## 13. Decision log

| Decision | Alternatives | Rationale |
| --- | --- | --- |
| PostgreSQL authority + Redis queue | Redis authority; PostgreSQL-only | Strong correctness with scalable traffic control |
| GA and assigned seats in V1 | GA only; seats only | Required product scope |
| Per-session queue | Per-tier; global | Fair isolation and simpler capacity control |
| Shuffle then FIFO | FIFO-only; weighted lottery | Fair pre-queue without millisecond advantage |
| Login before queue | Guest queue/checkout | Deduplication, recovery, and bot resistance |
| Next.js plus worker | One Next runtime; NestJS services | Solo velocity with reliable async work |
| Supabase Auth only | NextAuth; dual auth | Removes conflicting identity sources |
| Organizer is merchant | Platform merchant; hybrid | Avoid platform custody of organizer funds |
| Minimal PII | Universal NIK; no NIK support | Privacy by default with event-specific needs |
| At-least-once delivery | Distributed transactions | Practical reliability through idempotency |

## 14. Complexity targets

- Queue join/rank lookup: `O(log n)` time, `O(n)` session storage
- Pre-queue ranking: `O(n log n)` once per opening
- GA reservation: `O(k)` time and records for `k` requested items
- Assigned-seat reservation: `O(k log k)` for deterministic lock ordering and
  `O(k)` persisted items
- Checkout/webhook finalization: `O(k)` for `k` order items

## 15. Known trade-offs

- Supporting both inventory modes increases schema and concurrency-test scope.
- PostgreSQL serialization adds latency but admission makes it predictable.
- Polling is operationally simpler than persistent sockets but consumes more
  requests; adaptive intervals and jitter bound that cost.
- Per-organizer Midtrans credentials strengthen fund isolation but increase
  onboarding, secret management, and webhook routing complexity.
- The worker is another deployable, but it isolates retries and long-running
  work from HTTP request lifecycles.
