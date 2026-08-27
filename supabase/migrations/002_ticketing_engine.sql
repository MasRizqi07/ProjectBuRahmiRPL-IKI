create extension if not exists pgcrypto;

create schema if not exists ticketing;

create type ticketing.tenant_status as enum ('ACTIVE', 'SUSPENDED');
create type ticketing.membership_role as enum ('OWNER', 'ADMIN', 'OPERATOR', 'FINANCE', 'VIEWER');
create type ticketing.sales_session_status as enum ('DRAFT', 'PRE_QUEUE', 'OPEN', 'PAUSED', 'CLOSED', 'CANCELLED');
create type ticketing.inventory_mode as enum ('GENERAL_ADMISSION', 'ASSIGNED_SEAT');
create type ticketing.seat_status as enum ('AVAILABLE', 'HELD', 'SOLD', 'BLOCKED');
create type ticketing.reservation_status as enum ('HELD', 'CHECKOUT_PENDING', 'CONFIRMED', 'EXPIRED', 'RELEASED');
create type ticketing.order_status as enum ('PENDING_PAYMENT', 'PAID', 'CANCELLED', 'EXPIRED', 'PAYMENT_REVIEW_REQUIRED', 'REFUNDED');
create type ticketing.payment_status as enum ('INITIATING', 'PENDING', 'AUTHORIZED', 'SUCCEEDED', 'DENIED', 'EXPIRED', 'CANCELLED', 'REFUNDED', 'UNKNOWN');
create type ticketing.outbox_status as enum ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED');

create table ticketing.tenants (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9][a-z0-9-]{1,62}$'),
  name text not null check (char_length(name) between 2 and 120),
  status ticketing.tenant_status not null default 'ACTIVE',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table ticketing.tenant_memberships (
  tenant_id uuid not null references ticketing.tenants(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role ticketing.membership_role not null,
  created_at timestamptz not null default now(),
  primary key (tenant_id, user_id)
);

create table ticketing.merchant_configs (
  tenant_id uuid primary key references ticketing.tenants(id) on delete cascade,
  provider text not null check (provider = 'MIDTRANS'),
  environment text not null check (environment in ('SANDBOX', 'PRODUCTION')),
  merchant_id text not null,
  encrypted_server_key bytea not null,
  client_key text not null,
  key_version integer not null default 1 check (key_version > 0),
  enabled boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (provider, environment, merchant_id)
);

create table ticketing.venue_layouts (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references ticketing.tenants(id),
  name text not null,
  version integer not null default 1 check (version > 0),
  created_at timestamptz not null default now(),
  unique (tenant_id, id),
  unique (tenant_id, name, version)
);

create table ticketing.venue_sections (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null,
  venue_layout_id uuid not null,
  code text not null,
  name text not null,
  sort_order integer not null default 0,
  foreign key (tenant_id, venue_layout_id)
    references ticketing.venue_layouts(tenant_id, id) on delete cascade,
  unique (tenant_id, id),
  unique (venue_layout_id, code)
);

create table ticketing.venue_seats (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null,
  venue_layout_id uuid not null,
  section_id uuid not null,
  row_label text not null,
  seat_number text not null,
  x numeric(10, 4),
  y numeric(10, 4),
  foreign key (tenant_id, venue_layout_id)
    references ticketing.venue_layouts(tenant_id, id) on delete cascade,
  foreign key (tenant_id, section_id)
    references ticketing.venue_sections(tenant_id, id) on delete cascade,
  unique (tenant_id, id),
  unique (venue_layout_id, section_id, row_label, seat_number)
);

create table ticketing.events (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references ticketing.tenants(id),
  venue_layout_id uuid,
  slug text not null,
  title text not null,
  starts_at timestamptz not null,
  timezone text not null default 'Asia/Jakarta',
  currency char(3) not null default 'IDR' check (currency = 'IDR'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key (tenant_id, venue_layout_id)
    references ticketing.venue_layouts(tenant_id, id),
  unique (tenant_id, id),
  unique (tenant_id, slug)
);

create table ticketing.sales_sessions (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null,
  event_id uuid not null,
  name text not null,
  status ticketing.sales_session_status not null default 'DRAFT',
  pre_queue_opens_at timestamptz not null,
  sales_open_at timestamptz not null,
  sales_close_at timestamptz not null,
  hold_duration_seconds integer not null default 600 check (hold_duration_seconds between 60 and 1800),
  admission_ttl_seconds integer not null default 120 check (admission_ttl_seconds between 30 and 600),
  base_admission_rate_per_second integer not null default 50 check (base_admission_rate_per_second between 1 and 1000),
  max_tickets_per_order integer not null default 4 check (max_tickets_per_order between 1 and 20),
  service_fee_basis_points integer not null default 250 check (service_fee_basis_points between 0 and 10000),
  shuffle_commitment text,
  shuffle_seed_ciphertext bytea,
  version integer not null default 1 check (version > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (pre_queue_opens_at < sales_open_at),
  check (sales_open_at < sales_close_at),
  foreign key (tenant_id, event_id)
    references ticketing.events(tenant_id, id),
  unique (tenant_id, id)
);

create table ticketing.ticket_types (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null,
  event_id uuid not null,
  code text not null,
  name text not null,
  inventory_mode ticketing.inventory_mode not null,
  price integer not null check (price >= 0),
  sale_start_at timestamptz,
  sale_end_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key (tenant_id, event_id)
    references ticketing.events(tenant_id, id),
  unique (tenant_id, id),
  unique (event_id, code)
);

create table ticketing.inventory_pools (
  ticket_type_id uuid primary key,
  tenant_id uuid not null,
  event_id uuid not null,
  capacity integer not null check (capacity >= 0),
  held integer not null default 0 check (held >= 0),
  sold integer not null default 0 check (sold >= 0),
  version bigint not null default 0,
  updated_at timestamptz not null default now(),
  foreign key (tenant_id, ticket_type_id)
    references ticketing.ticket_types(tenant_id, id),
  foreign key (tenant_id, event_id)
    references ticketing.events(tenant_id, id),
  check (held + sold <= capacity),
  unique (tenant_id, ticket_type_id)
);

create table ticketing.event_seats (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null,
  event_id uuid not null,
  venue_seat_id uuid not null,
  ticket_type_id uuid not null,
  status ticketing.seat_status not null default 'AVAILABLE',
  reservation_id uuid,
  hold_expires_at timestamptz,
  price_override integer check (price_override is null or price_override >= 0),
  version bigint not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key (tenant_id, event_id)
    references ticketing.events(tenant_id, id),
  foreign key (tenant_id, venue_seat_id)
    references ticketing.venue_seats(tenant_id, id),
  foreign key (tenant_id, ticket_type_id)
    references ticketing.ticket_types(tenant_id, id),
  check (
    (status = 'HELD' and reservation_id is not null and hold_expires_at is not null)
    or (status <> 'HELD' and reservation_id is null and hold_expires_at is null)
  ),
  unique (tenant_id, id),
  unique (event_id, venue_seat_id)
);

create table ticketing.reservations (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null,
  sales_session_id uuid not null,
  admission_entry_id uuid not null,
  event_id uuid not null,
  user_id uuid not null references auth.users(id),
  status ticketing.reservation_status not null default 'HELD',
  expires_at timestamptz not null,
  subtotal integer not null check (subtotal >= 0),
  service_fee integer not null check (service_fee >= 0),
  total integer not null check (total = subtotal + service_fee),
  currency char(3) not null default 'IDR' check (currency = 'IDR'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key (tenant_id, sales_session_id)
    references ticketing.sales_sessions(tenant_id, id),
  foreign key (tenant_id, event_id)
    references ticketing.events(tenant_id, id),
  unique (tenant_id, id),
  unique (sales_session_id, admission_entry_id)
);

alter table ticketing.event_seats
  add constraint event_seats_reservation_fk
  foreign key (tenant_id, reservation_id)
  references ticketing.reservations(tenant_id, id);

create table ticketing.reservation_items (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null,
  reservation_id uuid not null,
  kind ticketing.inventory_mode not null,
  ticket_type_id uuid not null,
  event_seat_id uuid,
  quantity integer not null check (quantity > 0),
  unit_price integer not null check (unit_price >= 0),
  label text not null,
  foreign key (tenant_id, reservation_id)
    references ticketing.reservations(tenant_id, id) on delete cascade,
  foreign key (tenant_id, ticket_type_id)
    references ticketing.ticket_types(tenant_id, id),
  foreign key (tenant_id, event_seat_id)
    references ticketing.event_seats(tenant_id, id),
  check (
    (kind = 'GENERAL_ADMISSION' and event_seat_id is null)
    or (kind = 'ASSIGNED_SEAT' and event_seat_id is not null and quantity = 1)
  )
);

create table ticketing.orders (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null,
  reservation_id uuid not null,
  user_id uuid not null references auth.users(id),
  status ticketing.order_status not null default 'PENDING_PAYMENT',
  provider_order_id text not null unique,
  buyer_name text not null,
  buyer_email_ciphertext bytea not null,
  buyer_phone_ciphertext bytea not null,
  buyer_nik_ciphertext bytea,
  buyer_nik_consent_at timestamptz,
  buyer_nik_retention_until timestamptz,
  subtotal integer not null check (subtotal >= 0),
  service_fee integer not null check (service_fee >= 0),
  total integer not null check (total = subtotal + service_fee),
  currency char(3) not null default 'IDR' check (currency = 'IDR'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key (tenant_id, reservation_id)
    references ticketing.reservations(tenant_id, id),
  unique (tenant_id, id),
  unique (reservation_id),
  check (
    (buyer_nik_ciphertext is null and buyer_nik_consent_at is null and buyer_nik_retention_until is null)
    or
    (buyer_nik_ciphertext is not null and buyer_nik_consent_at is not null and buyer_nik_retention_until is not null)
  )
);

create table ticketing.order_items (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null,
  order_id uuid not null,
  ticket_type_id uuid not null,
  event_seat_id uuid,
  quantity integer not null check (quantity > 0),
  unit_price integer not null check (unit_price >= 0),
  label text not null,
  foreign key (tenant_id, order_id)
    references ticketing.orders(tenant_id, id) on delete cascade,
  foreign key (tenant_id, ticket_type_id)
    references ticketing.ticket_types(tenant_id, id),
  foreign key (tenant_id, event_seat_id)
    references ticketing.event_seats(tenant_id, id)
);

create table ticketing.payment_attempts (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null,
  order_id uuid not null,
  provider text not null check (provider = 'MIDTRANS'),
  provider_order_id text not null,
  provider_transaction_id text,
  status ticketing.payment_status not null default 'INITIATING',
  payment_token_ciphertext bytea,
  redirect_url text,
  amount integer not null check (amount >= 0),
  currency char(3) not null default 'IDR' check (currency = 'IDR'),
  failure_code text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key (tenant_id, order_id)
    references ticketing.orders(tenant_id, id),
  unique (tenant_id, id),
  unique (provider, provider_order_id),
  unique (provider, provider_transaction_id)
);

create table ticketing.idempotency_keys (
  tenant_id uuid not null references ticketing.tenants(id),
  user_id uuid not null references auth.users(id),
  scope text not null,
  key text not null,
  request_hash text not null,
  response_status integer,
  response_body jsonb,
  locked_until timestamptz not null,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null,
  primary key (tenant_id, user_id, scope, key)
);

create table ticketing.payment_inbox (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references ticketing.tenants(id),
  provider text not null,
  provider_event_key text not null,
  provider_order_id text not null,
  payload jsonb not null,
  received_at timestamptz not null default now(),
  processed_at timestamptz,
  processing_error text,
  unique (provider, provider_event_key)
);

create table ticketing.outbox (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references ticketing.tenants(id),
  topic text not null,
  aggregate_type text not null,
  aggregate_id uuid not null,
  payload jsonb not null,
  status ticketing.outbox_status not null default 'PENDING',
  attempts integer not null default 0 check (attempts >= 0),
  available_at timestamptz not null default now(),
  locked_at timestamptz,
  locked_by text,
  last_error text,
  created_at timestamptz not null default now(),
  completed_at timestamptz
);

create table ticketing.audit_log (
  id bigint generated always as identity primary key,
  tenant_id uuid references ticketing.tenants(id),
  actor_user_id uuid references auth.users(id),
  action text not null,
  aggregate_type text not null,
  aggregate_id uuid,
  metadata jsonb not null default '{}',
  occurred_at timestamptz not null default now()
);

create index sales_sessions_status_open_idx
  on ticketing.sales_sessions(status, sales_open_at);
create index inventory_pools_event_idx
  on ticketing.inventory_pools(tenant_id, event_id);
create index event_seats_availability_idx
  on ticketing.event_seats(tenant_id, event_id, ticket_type_id, status);
create index reservations_expiry_idx
  on ticketing.reservations(status, expires_at)
  where status in ('HELD', 'CHECKOUT_PENDING');
create index reservations_user_idx
  on ticketing.reservations(user_id, created_at desc);
create index orders_user_idx
  on ticketing.orders(user_id, created_at desc);
create index orders_nik_retention_idx
  on ticketing.orders(buyer_nik_retention_until)
  where buyer_nik_ciphertext is not null;
create index payment_attempts_order_idx
  on ticketing.payment_attempts(tenant_id, order_id, created_at desc);
create index outbox_pending_idx
  on ticketing.outbox(status, available_at, created_at)
  where status in ('PENDING', 'FAILED');

create function ticketing.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger tenants_set_updated_at before update on ticketing.tenants
for each row execute function ticketing.set_updated_at();
create trigger merchant_configs_set_updated_at before update on ticketing.merchant_configs
for each row execute function ticketing.set_updated_at();
create trigger events_set_updated_at before update on ticketing.events
for each row execute function ticketing.set_updated_at();
create trigger sales_sessions_set_updated_at before update on ticketing.sales_sessions
for each row execute function ticketing.set_updated_at();
create trigger ticket_types_set_updated_at before update on ticketing.ticket_types
for each row execute function ticketing.set_updated_at();
create trigger reservations_set_updated_at before update on ticketing.reservations
for each row execute function ticketing.set_updated_at();
create trigger orders_set_updated_at before update on ticketing.orders
for each row execute function ticketing.set_updated_at();
create trigger payment_attempts_set_updated_at before update on ticketing.payment_attempts
for each row execute function ticketing.set_updated_at();

create function ticketing.expire_reservations(batch_size integer default 100)
returns integer
language plpgsql
security definer
set search_path = ticketing, public
as $$
declare
  candidate record;
  expired_count integer := 0;
begin
  if batch_size < 1 or batch_size > 1000 then
    raise exception 'batch_size must be between 1 and 1000';
  end if;

  for candidate in
    select reservation.id, reservation.tenant_id
    from ticketing.reservations reservation
    where reservation.status in ('HELD', 'CHECKOUT_PENDING')
      and reservation.expires_at <= now()
    order by reservation.expires_at
    for update skip locked
    limit batch_size
  loop
    update ticketing.inventory_pools pool
    set held = pool.held - held_item.quantity,
        version = pool.version + 1,
        updated_at = now()
    from (
      select item.ticket_type_id, sum(item.quantity)::integer as quantity
      from ticketing.reservation_items item
      where item.tenant_id = candidate.tenant_id
        and item.reservation_id = candidate.id
        and item.kind = 'GENERAL_ADMISSION'
      group by item.ticket_type_id
    ) held_item
    where pool.tenant_id = candidate.tenant_id
      and pool.ticket_type_id = held_item.ticket_type_id
      and pool.held >= held_item.quantity;

    update ticketing.event_seats
    set status = 'AVAILABLE', reservation_id = null, hold_expires_at = null,
        version = version + 1, updated_at = now()
    where tenant_id = candidate.tenant_id
      and reservation_id = candidate.id
      and status = 'HELD';

    update ticketing.reservations
    set status = 'EXPIRED', updated_at = now()
    where id = candidate.id;

    update ticketing.orders
    set status = 'EXPIRED', updated_at = now()
    where tenant_id = candidate.tenant_id
      and reservation_id = candidate.id
      and status = 'PENDING_PAYMENT';

    insert into ticketing.outbox (
      tenant_id, topic, aggregate_type, aggregate_id, payload
    )
    select payment.tenant_id, 'payment.expire', 'payment_attempt', payment.id,
           jsonb_build_object('paymentAttemptId', payment.id)
    from ticketing.payment_attempts payment
    join ticketing.orders orders
      on orders.tenant_id = payment.tenant_id and orders.id = payment.order_id
    where orders.reservation_id = candidate.id
      and payment.status in ('INITIATING', 'PENDING', 'AUTHORIZED', 'UNKNOWN');

    expired_count := expired_count + 1;
  end loop;

  return expired_count;
end;
$$;

revoke all on function ticketing.expire_reservations(integer) from public;

create function ticketing.redact_expired_nik(batch_size integer default 100)
returns integer
language plpgsql
security definer
set search_path = ticketing, public
as $$
declare
  redacted_count integer;
begin
  if batch_size < 1 or batch_size > 1000 then
    raise exception 'batch_size must be between 1 and 1000';
  end if;

  with candidates as (
    select id
    from ticketing.orders
    where buyer_nik_ciphertext is not null
      and buyer_nik_retention_until <= now()
    order by buyer_nik_retention_until
    for update skip locked
    limit batch_size
  )
  update ticketing.orders orders
  set buyer_nik_ciphertext = null,
      buyer_nik_consent_at = null,
      buyer_nik_retention_until = null,
      updated_at = now()
  from candidates
  where orders.id = candidates.id;

  get diagnostics redacted_count = row_count;
  return redacted_count;
end;
$$;

revoke all on function ticketing.redact_expired_nik(integer) from public;

alter table ticketing.tenants enable row level security;
alter table ticketing.tenant_memberships enable row level security;
alter table ticketing.events enable row level security;
alter table ticketing.sales_sessions enable row level security;
alter table ticketing.ticket_types enable row level security;
alter table ticketing.reservations enable row level security;
alter table ticketing.orders enable row level security;

create policy tenant_membership_read on ticketing.tenant_memberships
for select using (user_id = auth.uid());

create policy tenant_member_tenant_read on ticketing.tenants
for select using (
  exists (
    select 1 from ticketing.tenant_memberships membership
    where membership.tenant_id = tenants.id and membership.user_id = auth.uid()
  )
);

create policy event_public_read on ticketing.events for select using (true);
create policy sales_session_public_read on ticketing.sales_sessions for select using (true);
create policy ticket_type_public_read on ticketing.ticket_types for select using (true);

create policy reservation_owner_read on ticketing.reservations
for select using (user_id = auth.uid());
create policy order_owner_read on ticketing.orders
for select using (user_id = auth.uid());

revoke all on all tables in schema ticketing from anon, authenticated;
grant usage on schema ticketing to authenticated;
grant select on ticketing.events, ticketing.sales_sessions, ticketing.ticket_types to authenticated;
grant select on ticketing.reservations, ticketing.orders to authenticated;
