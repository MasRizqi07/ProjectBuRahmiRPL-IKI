# Serverless Checkout Engine

Status: implemented, external evidence gates pending  
Target: Next.js Route Handlers on Vercel with Upstash Redis REST

## Runtime flow

1. Authenticated users join an event queue through an atomic Redis script.
   Cold inventory/catalog reads use a Redis initialization lease, so a traffic
   burst produces one PostgreSQL loader instead of a cache stampede.
   Supabase JWT claims are verified through cached JWKS rather than making an
   Auth API user lookup on every queue poll.
2. Queue-status polls lazily sweep expired admission leases and holds, then
   admit users whose rank is inside `released + checkout capacity`.
3. Reserve validates a server-side tier price and atomically performs the
   inventory decrement, admission consumption, hold creation, expiry index,
   and idempotency response write.
4. A signed Midtrans notification finalizes the hold exactly once. Successful
   payment releases a checkout slot without returning inventory. Failure
   releases both the checkout slot and inventory.
5. Vercel Cron performs the same expiry sweep as a safety net; correctness does
   not depend on cron timing. The cron advances an `SSCAN` cursor and processes
   events in bounded parallel batches instead of starving events beyond a
   fixed first page.

## Correctness changes from the initial directive

- Holds do not disappear through Redis TTL before their quantity can be
  restored. Expiry is indexed in a sorted set and swept atomically.
- Finalization checks that a hold exists before changing inventory or the
  released counter, making duplicate webhooks harmless.
- Idempotency lookup, inventory decrement, hold creation, and response storage
  occur in one Lua execution. A process crash cannot leave a successful
  decrement without its idempotency result.
- Event and per-tier inventory counters are decremented together so one tier
  cannot consume another tier's capacity.
- Server-authoritative tier prices are cached for five minutes behind a
  compare-and-delete single-flight lock; clients never provide the price.
- Expired Redis holds are recorded in an expiry reconciliation set before the
  SQL order is updated.

## Redis namespace

All event-local keys use the hash tag `wt-edge:{eventId}`. Important keys are:

- `inventory` and `inventory-tier:{tierId}`
- `queue`, `queue-sequence`, and `states`
- `released`, `admission-expiries`, and `hold-expiries`
- `admitted-user:{userId}` and `hold:{userId}`
- `idem:{key}` and `expired-orders`

## Evidence gates

Compilation and unit tests are necessary but do not satisfy the phase gates.
The following require configured Supabase, Upstash, PostgreSQL, Midtrans
Sandbox, and k6 environments:

- raw three-user join/rank/admission sequence;
- 10,000-way reserve against exactly 100 seeded tickets;
- concurrent duplicate-idempotency proof;
- forged and valid Midtrans notification proof;
- manual expired-hold sweep proof.
