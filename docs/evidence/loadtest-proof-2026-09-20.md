# WAR TICKET — Corrected Checkout Gate Evidence

**Date:** 2026-09-20 (Asia/Jakarta)
**Repository:** `MasRizqi07/ProjectBuRahmiRPL-IKI`
**Branch:** `main`
**Code-under-test commit:** `6c8f2a8`
**Verdict:** **NO-GO / NOT CERTIFIED FOR 10,000 CONCURRENT CHECKOUTS**

This document retracts the earlier claim that the platform was completely production-ready. The earlier 150-VU run was below the required scale, the earlier webhook test did not exercise `/api/v1/payments/midtrans/webhook`, and the earlier sweep test released zero holds. None of those results certifies the requested 10,000-concurrent gate.

## 1. Current gate verdicts

| Gate | Required proof | Current result | Go / no-go |
| --- | --- | --- | --- |
| 1 | Three real buyers join, become admitted, and reserve | Corrected rerun stopped at fail-fast config validation: `DATABASE_URL` is absent | **NO-GO** |
| 2 | 10,000 VUs against capacity 100: exactly 100 holds, 9,900 sold out, zero unexpected responses | Thresholds are restored; a real 10,000-VU run has not completed | **NO-GO** |
| 3 | Two concurrent identical requests produce one hold and one inventory decrement | Corrected rerun stopped before admission because `DATABASE_URL` is absent | **NO-GO** |
| 4 | Valid-shaped forged webhook is exact 403; correctly signed webhook is exact 200 `{"accepted":true}` | Corrected runner exists, but no genuine hold/payment context can be created in the current environment | **NO-GO** |
| 5 | A genuine expired hold is swept and inventory increases by its quantity | Corrected runner exists, but no genuine hold can be created in the current environment | **NO-GO** |

The fixture itself is clean and valid. Runtime checkout is blocked intentionally by the restored fail-fast configuration because neither local env files nor the linked Vercel project contain `DATABASE_URL`. The linked Vercel project also has no `CREDENTIAL_ENCRYPTION_KEY`.

## 2. Fixture reset evidence

Command:

```text
pnpm fixture:seed
```

Raw output (exit 0):

```text
🔍 Checking database connection & schema...
🔎 Looking for existing fixture 'WAR TICKET 10K GATE: 100-TICKET FIXTURE'...
♻️ Reusing existing fixture event: 9042d923-afe0-4035-8bf7-fe97d2b446ef
🔄 Reset tier bca6a8d4-d451-4072-8b9c-396810c1f458 to capacity=100, sold=0

============================================================
🎯 LOAD TEST FIXTURE READY:
  EVENT_ID=9042d923-afe0-4035-8bf7-fe97d2b446ef
  TIER_ID=bca6a8d4-d451-4072-8b9c-396810c1f458
  CAPACITY=100
============================================================
```

Commands:

```text
pnpm --filter @war-ticket/web exec tsx ../../scripts/load-test/reset-redis-event.ts
pnpm --filter @war-ticket/web exec tsx ../../scripts/load-test/check-inventory.ts
```

Raw output (exit 0):

```text
Resetting Redis state for event 9042d923-afe0-4035-8bf7-fe97d2b446ef...
✅ Redis state for event 9042d923-afe0-4035-8bf7-fe97d2b446ef successfully reset!
========================================
Event ID: 9042d923-afe0-4035-8bf7-fe97d2b446ef
Event Inventory Remaining: null
Tier Inventory Remaining:  null
Active Holds in Redis:     0
Total (Remaining + Holds): 0 / 100
========================================
```

`null` is the expected clean, lazy-uninitialized Redis state. The first valid queue request initializes the values from the 100-ticket database fixture.

Laziness Ladder: reused `fixture:seed`, `reset-redis-event.ts`, `check-inventory.ts`, and the existing edge key/client modules; no alternate reset mechanism was added.

## 3. Mandatory correction batches

### 3.1 Gate 2 thresholds and qualification guard

Commits: `dc41c1e` and follow-up exact-formula correction `6c8f2a8`.

`tests/load/serverless-reserve.js` now reads `fixture.capacity`, requires at least capacity-sized contention, warns below `capacity * 10`, requires enough unique cookies for every VU, and uses these hard thresholds:

```text
holds_created: count==100
sold_out: count==VUS-100
unexpected_responses: count==0
http_req_failed: rate<0.01
```

Raw `k6 inspect` output at 150 VUs (exit 0):

```text
time="2026-09-20T23:38:28+07:00" level=warning msg="!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!" source=console
time="2026-09-20T23:38:28+07:00" level=warning msg="SMOKE TEST ONLY: VUS=150 is below the Gate 2 minimum of 1000 (10x fixture capacity 100). This run MUST NOT be reported as Gate 2 PASSED." source=console
time="2026-09-20T23:38:28+07:00" level=warning msg="!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!" source=console
"vus": 150,
"iterations": 1,
"maxDuration": "5m0s"
"thresholds": {
  "holds_created": ["count==100"],
  "http_req_failed": ["rate<0.01"],
  "sold_out": ["count==50"],
  "unexpected_responses": ["count==0"]
}
```

Runtime-specific proof: no 10,000-VU result exists yet, so Gate 2 is not passed.

Laziness Ladder: changed only the existing k6 configuration and reused the fixture JSON; no new load-test framework or dependency was introduced.

### 3.2 Gate 4 forged and valid signature assertions

Commit: `166f444`.

The runner now creates a real hold, uses its real `WT-EDGE-*` provider order ID, supplies every required Midtrans field, requires forged signature response `403 FORBIDDEN` with a signature-specific body, computes the valid SHA-512 digest with `MIDTRANS_SERVER_KEY`, and requires `200` with `{"accepted":true}`.

Focused command output (exit 0, no stdout):

```text
pnpm exec tsc --noEmit --target ES2022 --module NodeNext --moduleResolution NodeNext --types node --skipLibCheck scripts/load-test/verify-gates.ts
```

Current runtime output is recorded under Gate 4 below. It fails during genuine-hold setup and never claims that signature verification ran.

Laziness Ladder: reused the existing queue/reserve endpoints, contract fields, Node `crypto` SHA-512, and existing gate runner; no crypto or HTTP dependency was added.

### 3.3 Edge order persistence failures are surfaced

Commit: `4152c16`.

`EdgeCheckoutRepository.upsertHoldOrder` now emits structured observability events and throws if both direct SQL and Supabase fallback persistence fail. A primary SQL failure followed by successful fallback is a structured warning; it is no longer silently accepted.

Raw focused output (all exit 0):

```text
> @war-ticket/database lint
> eslint src

> @war-ticket/database typecheck
> tsc --noEmit

> @war-ticket/database test
> vitest run --passWithNoTests

✓ src/edge-checkout-repository.test.ts (3 tests)
Test Files  1 passed (1)
Tests       3 passed (3)
```

Runtime-specific assertions cover:

```text
1. no SQL + failed fallback -> throws and logs edge_order_persistence_failed
2. failed SQL + successful fallback -> returns and logs edge_order_primary_persistence_failed_fallback_succeeded
3. failed SQL + failed fallback -> throws and logs edge_order_persistence_failed
```

Historical coverage statement: before this correction, `packages/database` had no test files and there is no credible evidence that the Supabase-client fallback success path had ever been exercised. It was unverified code. The new tests exercise it with a mocked client. A live fallback success remains unverified; the live PostgREST schema probe returned HTTP 406.

Laziness Ladder: reused `@war-ticket/observability`, the existing repository, and Vitest already installed in the workspace; no logger, metric transport, or test package was added.

### 3.4 `DATABASE_URL` fail-fast restored

Commit: `b1650ef`.

The preferred option was selected: `DATABASE_URL` is required for web/shared/worker config with no default in any environment.

Raw output (exit 0):

```text
> @war-ticket/config lint
> eslint src

> @war-ticket/config typecheck
> tsc --noEmit

> @war-ticket/config test
> vitest run --passWithNoTests

✓ src/index.test.ts (2 tests)
Test Files  1 passed (1)
Tests       2 passed (2)
```

Runtime-specific proof from an actual request:

```text
Join status: 400 | Body: {"error":{"code":"VALIDATION_ERROR","message":"Request validation failed","requestId":"3b2f772e-caee-4bb2-8d23-c9ee316b98d8","retryable":false,"details":{"fields":{"DATABASE_URL":["Required"]}}}}
```

Configuration presence checks:

```text
DATABASE_URL=False
CREDENTIAL_ENCRYPTION_KEY=False
```

The linked Vercel project's Project and Shared variable searches both returned:

```text
No Results Found
Your search for "DATABASE_URL" did not return any results.

No Results Found
Your search for "CREDENTIAL_ENCRYPTION_KEY" did not return any results.
```

Laziness Ladder: restored the original required Zod field in one line and added only two regression assertions to the existing config package.

### 3.5 Gate 5 and gate verdict hardening

Commits: `8ef466d` and `4bd2d18`.

The corrected Gate 5 runner:

1. creates a genuine admitted hold;
2. prints the shared inventory audit before mutation;
3. edits that hold's existing Redis payload and sorted-set score into the past;
4. requires an exact unauthenticated `401 UNAUTHORIZED`;
5. requires an authenticated `200` whose event result reports at least one expired hold;
6. prints inventory after the sweep and requires event/tier inventory `+quantity`, holds `-1`, and deletion of the hold key.

HTTP 500 is no longer accepted as success. Gate 1 now prints `FAILED`, not “completed with warnings.” Gate 3 now also audits the one-ticket inventory decrement and one-hold increase.

Raw checks (exit 0; the focused TypeScript command emitted no stdout):

```text
pnpm exec tsc --noEmit --target ES2022 --module NodeNext --moduleResolution NodeNext --types node --skipLibCheck scripts/load-test/verify-gates.ts scripts/load-test/check-inventory.ts

> @war-ticket/web lint
> eslint .
```

Runtime-specific proof is blocked before hold creation and is recorded below; Gate 5 is therefore not passed.

Laziness Ladder: reused `edgeRedis()`, `edgeKeys`, the cron route, and `check-inventory.ts`; no new expiry mechanism, Redis client, or package was introduced.

## 4. Corrected runtime gate outputs

All commands below targeted the exact local source after the clean fixture reset. There was no substitution of the stale August Vercel deployment.

### Gate 1 — NO-GO

Command exited 1:

```text
pnpm gates:verify -- --gate=1 --url=http://localhost:3000
```

Raw result:

```text
Provisioned Buyers: 150
📌 GATE 1: 3-User Join/Rank/Admission & Reserve Sequence

▶️ [Buyer 1] Joining queue for event 9042d923-afe0-4035-8bf7-fe97d2b446ef...
  Join status: 400 | Body: {"error":{"code":"VALIDATION_ERROR","message":"Request validation failed","requestId":"3b2f772e-caee-4bb2-8d23-c9ee316b98d8","retryable":false,"details":{"fields":{"DATABASE_URL":["Required"]}}}}
▶️ [Buyer 1] Checking queue status...
  Queue status: 400 | Body: {"error":{"code":"VALIDATION_ERROR","message":"Request validation failed","requestId":"550ef517-7576-456e-b219-e90d10caaa15","retryable":false,"details":{"fields":{"DATABASE_URL":["Required"]}}}}
▶️ [Buyer 1] Creating reservation...
  Reserve status: 400 | Body: {"error":{"code":"VALIDATION_ERROR","message":"Request validation failed","requestId":"ccf88fbe-1845-401b-ad8c-12648fb5a876","retryable":false,"details":{"fields":{"DATABASE_URL":["Required"]}}}}

▶️ [Buyer 2] Joining queue for event 9042d923-afe0-4035-8bf7-fe97d2b446ef...
  Join status: 400 | Body: {"error":{"code":"VALIDATION_ERROR","message":"Request validation failed","requestId":"08d2c876-8420-42e2-81fb-ee2d6aa3a766","retryable":false,"details":{"fields":{"DATABASE_URL":["Required"]}}}}
▶️ [Buyer 2] Checking queue status...
  Queue status: 400 | Body: {"error":{"code":"VALIDATION_ERROR","message":"Request validation failed","requestId":"57323008-0746-4389-be58-0b74c9c1ff40","retryable":false,"details":{"fields":{"DATABASE_URL":["Required"]}}}}
▶️ [Buyer 2] Creating reservation...
  Reserve status: 400 | Body: {"error":{"code":"VALIDATION_ERROR","message":"Request validation failed","requestId":"2faa1a3f-1a5a-4660-b59f-eaac2fdc96b9","retryable":false,"details":{"fields":{"DATABASE_URL":["Required"]}}}}

▶️ [Buyer 3] Joining queue for event 9042d923-afe0-4035-8bf7-fe97d2b446ef...
  Join status: 400 | Body: {"error":{"code":"VALIDATION_ERROR","message":"Request validation failed","requestId":"0773c8eb-c8eb-46db-b500-79c34195f508","retryable":false,"details":{"fields":{"DATABASE_URL":["Required"]}}}}
▶️ [Buyer 3] Checking queue status...
  Queue status: 400 | Body: {"error":{"code":"VALIDATION_ERROR","message":"Request validation failed","requestId":"b56d69cf-25bb-4070-a7f8-8ce675409a2d","retryable":false,"details":{"fields":{"DATABASE_URL":["Required"]}}}}
▶️ [Buyer 3] Creating reservation...
  Reserve status: 400 | Body: {"error":{"code":"VALIDATION_ERROR","message":"Request validation failed","requestId":"8e086c8f-a399-4e0e-810f-845d9fef6c41","retryable":false,"details":{"fields":{"DATABASE_URL":["Required"]}}}}

Gate 1 Result: ❌ FAILED
Exit status 1
```

### Gate 3 — NO-GO

Command exited 1:

```text
pnpm gates:verify -- --gate=3 --url=http://localhost:3000
```

Raw result:

```text
📌 GATE 3: Concurrent Duplicate-Idempotency Proof
[Gate 3] Buyer 4 joining queue & obtaining admission...
Join response: 400 | {"error":{"code":"VALIDATION_ERROR","message":"Request validation failed","requestId":"0b15b5a5-5953-4a51-a43a-9d10cf9da007","retryable":false,"details":{"fields":{"DATABASE_URL":["Required"]}}}}
Queue response: 400 | {"error":{"code":"VALIDATION_ERROR","message":"Request validation failed","requestId":"d5a2fa6a-610f-476d-b81b-9976aa1a12ee","retryable":false,"details":{"fields":{"DATABASE_URL":["Required"]}}}}
❌ GATE 3 FAILED: buyer did not reach the admitted state.
Exit status 1
```

### Gate 4 — NO-GO

Command exited 1:

```text
pnpm gates:verify -- --gate=4 --url=http://localhost:3000
```

Raw result:

```text
📌 GATE 4: Midtrans Notification Signature Proof (Forged vs Valid)
--- Gate 4 setup: real admitted buyer and real hold ---
Join response: 400 | {"error":{"code":"VALIDATION_ERROR","message":"Request validation failed","requestId":"9ce66a85-d000-4f01-a680-bcff38fc8667","retryable":false,"details":{"fields":{"DATABASE_URL":["Required"]}}}}
❌ Gate 4 setup failed: expected a genuine HOLD_CREATED response.
Exit status 1
```

No forged webhook was sent after this setup failure. No valid webhook was sent. Signature verification is **unverified**, not passed.

There is also a data-model integration gap to resolve after configuration: edge `/reserve` persists `ticketing.edge_orders`, while `/api/v1/payments/midtrans/webhook` resolves context from `ticketing.payment_attempts` plus `ticketing.merchant_configs`. No trigger or foreign-key bridge currently creates that payment attempt for a `WT-EDGE-*` provider order. This must be designed and tested; changing the gate to a different endpoint would not satisfy the ticket.

### Gate 5 — NO-GO

Command exited 1:

```text
pnpm gates:verify -- --gate=5 --url=http://localhost:3000
```

Raw result:

```text
📌 GATE 5: Expired-Hold Inventory Release Proof
--- Gate 5 setup: real admitted buyer and real hold ---
Join response: 400 | {"error":{"code":"VALIDATION_ERROR","message":"Request validation failed","requestId":"ef1a25c5-24cd-4a80-be67-9804eb4e8ec3","retryable":false,"details":{"fields":{"DATABASE_URL":["Required"]}}}}
❌ Gate 5 setup failed: expected a genuine HOLD_CREATED response.
Exit status 1
```

No expiry mutation or sweep was performed after the genuine-hold setup failed. The endpoint's earlier zero-expired-hold `200` is not accepted as release proof.

## 5. Gate 2 scale and latency status

### Qualification boundary

- Capacity: 100.
- Minimum qualifying contention: 1,000 VUs (`capacity * 10`).
- Requested final target: 10,000 VUs.
- Required 10,000-VU counters: 100 holds, 9,900 sold out, zero unexpected responses, HTTP failure rate below 1%.
- Current qualifying run: none.

### Provisioning

The exact requested command was started without modifying the proven harness:

```text
pnpm loadtest:provision --count=10000
```

The command did **not** finish. It loaded the existing 150 buyers, advanced through a safely written checkpoint of 875 buyers, repeatedly hit the live Supabase Auth request-rate limit, and was stopped only after that checkpoint because the absent `DATABASE_URL` already made a checkout run impossible.

Raw output (terminal exit 1 after interruption):

```text
[Cache] Loaded 150 existing provisioned buyers from disk.
[Provision] Processing batch 851 to 875 of 10000...
[WARN] Sign-in for loadtest-buyer-00875@warticket.test failed: Request rate limit reached. Retrying in 1072.5845514248995ms...
[Provision] Processing batch 876 to 900 of 10000...
[WARN] Sign-in for loadtest-buyer-00884@warticket.test failed: Request rate limit reached. Retrying in 1434.3789698319881ms...
```

Checkpoint audit:

```text
COOKIE_COUNT=875
USER_MAP_COUNT=875
```

This interrupted run is **zero evidence of 10,000-buyer readiness**. The resumable harness will reload the 875-buyer checkpoint when the same command is run again. No 10,000-VU k6 run was attempted with an undersized or duplicated cookie set.

### Latency investigation before scale-up

The earlier 150-VU run reported:

```text
http_req_duration: avg=6.87s max=27.76s
iteration_duration: avg=18.66s max=36.7s
```

The k6 loop does not sleep for the API's `pollAfterMs` (3–5 seconds). It sleeps only 300 ms between `WAITING` polls, so `pollAfterMs` is not being summed into the reported HTTP duration.

Upstash dashboard observations for database `War-Ticket-Paltform` during the earlier run:

```text
Plan: Free Tier
Commands: approximately 14K / 500K monthly allowance
Observed peak throughput: approximately 8.678 commands/second
Displayed subscription limit: 10,000 commands/second
Service Time Latency active buckets: 0 ms in the dashboard view
```

There was no dashboard evidence of Upstash throttling at 150 VUs. The existing latency is therefore more likely in the end-to-end app/auth/network path. This is an inference from the dashboard and code path, not a completed distributed trace.

Laziness Ladder: investigated the existing dashboard and polling code before proposing capacity changes; no timeout or threshold was relaxed.

## 6. Aggregate local verification

After deleting only the malformed generated `.next` cache left by an interrupted dev server, the clean aggregate command completed with exit 0:

```text
pnpm verify

Tasks: 9 successful, 9 total   # lint
Tasks: 9 successful, 9 total   # typecheck

@war-ticket/config:test
✓ src/index.test.ts (2 tests)

@war-ticket/database:test
✓ src/edge-checkout-repository.test.ts (3 tests)

@war-ticket/web:test
Test Files  5 passed (5)
Tests       12 passed (12)

@war-ticket/web:build
✓ Compiled successfully in 48s
✓ Generating static pages using 11 workers (65/65)

Tasks: 2 successful, 2 total   # build
Exit code: 0
```

This is compile/test evidence only. It does not promote any runtime gate to PASS.

## 7. Required closure actions

1. Supply the actual Supabase PostgreSQL `DATABASE_URL` for this project locally and in the deployment environment. Do not reintroduce a default.
2. Supply `CREDENTIAL_ENCRYPTION_KEY` and ensure it matches the key used by `pnpm merchant:configure`.
3. Resolve the explicit `edge_orders` to `payment_attempts`/merchant-context integration for `WT-EDGE-*` notifications on `/api/v1/payments/midtrans/webhook`.
4. Re-reset the 100-ticket fixture.
5. Rerun Gates 1, 3, 4, and 5 and retain exact response bodies plus before/after inventory.
6. Complete and validate all 10,000 buyer sessions.
7. Run k6 at 10,000 VUs with the unchanged thresholds and capture the complete summary plus before/after inventory audit.
8. If any threshold fails or a provider throttles, retain that failure as the finding.

## 8. Final certification

The source-level corrections are implemented and locally verified. The platform is **not** certified for 10,000 concurrent checkout attempts. Current release verdict: **NO-GO**.

The previous “completely production-ready” conclusion is withdrawn.
