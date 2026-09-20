-- ====================================================================
-- WAR TICKET PLATFORM: COMPLETE CONSOLIDATED MIGRATION
-- Automatically cleans existing relations to prevent 42P07 conflicts
-- ====================================================================

-- 1. CLEAN TEARDOWN (Ensures script can run repeatedly without "relation already exists" errors)
drop table if exists public.concierge_cases cascade;
drop table if exists public.elite_memberships cascade;
drop table if exists public.event_subscriptions cascade;
drop table if exists public.community_messages cascade;
drop table if exists public.promo_redemptions cascade;
drop table if exists public.promo_campaigns cascade;
drop table if exists public.disputes cascade;
drop table if exists public.organizer_applications cascade;
drop table if exists public.legal_consents cascade;
drop table if exists public.legal_documents cascade;
drop table if exists public.newsletter_subscriptions cascade;
drop table if exists public.support_cases cascade;
drop table if exists public.notifications cascade;
drop table if exists public.orders cascade;
drop table if exists public.ticket_tiers cascade;
drop table if exists public.concerts cascade;
drop table if exists public.profiles cascade;
drop schema if exists ticketing cascade;

-- 2. ENABLE EXTENSIONS
create extension if not exists "uuid-ossp";
create extension if not exists pgcrypto;

-- ==========================================
-- FILE: 001_initial_schema.sql
-- ==========================================
-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ============================================
-- CONCERTS TABLE
-- ============================================
create table if not exists public.concerts (
  id uuid primary key default uuid_generate_v4(),
  title text not null,
  artist text not null,
  venue text not null,
  city text not null,
  date timestamptz not null,
  image_url text,
  category text not null check (
    category in ('pop','rock','jazz','electronic','hiphop','indie','other')
  ),
  status text not null default 'available' check (
    status in ('available','limited','soldout')
  ),
  description text,
  tags text[] default '{}',
  is_featured boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ============================================
-- TICKET TIERS TABLE
-- ============================================
create table if not exists public.ticket_tiers (
  id uuid primary key default uuid_generate_v4(),
  concert_id uuid not null references public.concerts(id) on delete cascade,
  name text not null,
  price integer not null,
  capacity integer not null,
  sold integer not null default 0,
  perks text[] default '{}',
  sort_order integer default 0,
  created_at timestamptz default now()
);

-- ============================================
-- PROFILES TABLE (extends Supabase Auth)
-- ============================================
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  phone text,
  avatar_url text,
  role text not null default 'user' check (role in ('user','admin')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Backfill profiles for any already registered auth users
insert into public.profiles (id)
select id from auth.users
on conflict (id) do nothing;

-- ============================================
-- ORDERS TABLE
-- ============================================
create table if not exists public.orders (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.profiles(id),
  concert_id uuid not null references public.concerts(id),
  tier_id uuid not null references public.ticket_tiers(id),
  quantity integer not null default 1,
  total_price integer not null,
  status text not null default 'pending' check (
    status in ('pending','paid','cancelled','refunded')
  ),
  payment_token text,
  payment_url text,
  ticket_code text unique default upper(substring(replace(gen_random_uuid()::text, '-', ''), 1, 10)),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

-- Concerts: public read, admin write
alter table public.concerts enable row level security;

drop policy if exists "Concerts are publicly readable" on public.concerts;
create policy "Concerts are publicly readable"
  on public.concerts for select using (true);

drop policy if exists "Admins can insert concerts" on public.concerts;
create policy "Admins can insert concerts"
  on public.concerts for insert
  with check (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

drop policy if exists "Admins can update concerts" on public.concerts;
create policy "Admins can update concerts"
  on public.concerts for update
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

-- Ticket tiers: public read, admin write
alter table public.ticket_tiers enable row level security;

drop policy if exists "Tiers are publicly readable" on public.ticket_tiers;
create policy "Tiers are publicly readable"
  on public.ticket_tiers for select using (true);

drop policy if exists "Admins can manage tiers" on public.ticket_tiers;
create policy "Admins can manage tiers"
  on public.ticket_tiers for all
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

-- Profiles: users can read/update own profile
alter table public.profiles enable row level security;

drop policy if exists "Users can view own profile" on public.profiles;
create policy "Users can view own profile"
  on public.profiles for select
  using (auth.uid() = id);

drop policy if exists "Users can update own profile" on public.profiles;
create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- Orders: users can read own orders only
alter table public.orders enable row level security;

drop policy if exists "Users can view own orders" on public.orders;
create policy "Users can view own orders"
  on public.orders for select
  using (auth.uid() = user_id);

drop policy if exists "Users can create orders" on public.orders;
create policy "Users can create orders"
  on public.orders for insert
  with check (auth.uid() = user_id);

-- Admins can view all orders
drop policy if exists "Admins can view all orders" on public.orders;
create policy "Admins can view all orders"
  on public.orders for select
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

-- ============================================
-- FUNCTIONS & TRIGGERS
-- ============================================

-- Auto-create profile on user signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, avatar_url)
  values (
    new.id,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'avatar_url'
  )
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Auto-update updated_at timestamp
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists concerts_updated_at on public.concerts;
create trigger concerts_updated_at
  before update on public.concerts
  for each row execute procedure public.handle_updated_at();

drop trigger if exists orders_updated_at on public.orders;
create trigger orders_updated_at
  before update on public.orders
  for each row execute procedure public.handle_updated_at();

-- ============================================
-- INDEXES
-- ============================================
create index if not exists idx_concerts_city on public.concerts(city);
create index if not exists idx_concerts_category on public.concerts(category);
create index if not exists idx_concerts_status on public.concerts(status);
create index if not exists idx_concerts_date on public.concerts(date);
create index if not exists idx_concerts_featured on public.concerts(is_featured) where is_featured = true;
create index if not exists idx_tiers_concert_id on public.ticket_tiers(concert_id);
create index if not exists idx_orders_user_id on public.orders(user_id);
create index if not exists idx_orders_concert_id on public.orders(concert_id);

-- ==========================================
-- FILE: 002_ticketing_engine.sql
-- ==========================================
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


-- ==========================================
-- FILE: 003_serverless_checkout.sql
-- ==========================================
create type ticketing.edge_order_status as enum (
  'HELD',
  'PAID',
  'FAILED',
  'EXPIRED',
  'PAYMENT_REVIEW_REQUIRED'
);

create table ticketing.edge_orders (
  id uuid primary key,
  user_id uuid not null references auth.users(id),
  event_id uuid not null references public.concerts(id),
  tier_id uuid not null references public.ticket_tiers(id),
  idempotency_key text not null,
  request_hash text not null,
  provider_order_id text not null unique,
  quantity integer not null check (quantity between 1 and 4),
  unit_price integer not null check (unit_price >= 0),
  amount integer not null check (amount = unit_price * quantity),
  currency char(3) not null default 'IDR' check (currency = 'IDR'),
  status ticketing.edge_order_status not null default 'HELD',
  hold_expires_at timestamptz not null,
  provider_transaction_id text,
  paid_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, event_id, idempotency_key)
);

create table ticketing.edge_payment_inbox (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references ticketing.edge_orders(id),
  provider_event_key text not null unique,
  payload jsonb not null,
  received_at timestamptz not null default now(),
  processed_at timestamptz
);

create index edge_orders_user_created_idx
  on ticketing.edge_orders(user_id, created_at desc);
create index edge_orders_expiry_idx
  on ticketing.edge_orders(status, hold_expires_at)
  where status = 'HELD';

create trigger edge_orders_set_updated_at before update on ticketing.edge_orders
for each row execute function ticketing.set_updated_at();

alter table ticketing.edge_orders enable row level security;
create policy edge_order_owner_read on ticketing.edge_orders
for select using (user_id = auth.uid());

revoke all on ticketing.edge_orders, ticketing.edge_payment_inbox from anon, authenticated;
grant select on ticketing.edge_orders to authenticated;


-- ==========================================
-- FILE: 004_legacy_order_hardening.sql
-- ==========================================
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


-- ==========================================
-- FILE: 005_auth_rbac_hardening.sql
-- ==========================================
-- Phase 2: authoritative application roles, organizer RBAC, and auditable mutations.

alter table public.profiles drop constraint if exists profiles_role_check;
update public.profiles set role = case role when 'admin' then 'platform_admin' else 'buyer' end;
alter table public.profiles alter column role set default 'buyer';
alter table public.profiles add constraint profiles_role_check
  check (role in ('buyer', 'support', 'platform_admin'));

alter table public.profiles
  add column if not exists email_notifications boolean not null default true,
  add column if not exists whatsapp_notifications boolean not null default false,
  add column if not exists marketing_consent_at timestamptz,
  add column if not exists terms_version text,
  add column if not exists terms_accepted_at timestamptz;

create or replace function public.is_platform_staff(required_roles text[] default array['platform_admin'])
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = any(required_roles)
  );
$$;

revoke all on function public.is_platform_staff(text[]) from public;
grant execute on function public.is_platform_staff(text[]) to authenticated;

create or replace function ticketing.has_tenant_role(target_tenant uuid, allowed_roles ticketing.membership_role[])
returns boolean
language sql
stable
security definer
set search_path = ticketing, public
as $$
  select exists (
    select 1 from ticketing.tenant_memberships
    where tenant_id = target_tenant
      and user_id = auth.uid()
      and role = any(allowed_roles)
  ) or public.is_platform_staff(array['platform_admin']);
$$;

revoke all on function ticketing.has_tenant_role(uuid, ticketing.membership_role[]) from public;
grant execute on function ticketing.has_tenant_role(uuid, ticketing.membership_role[]) to authenticated;

drop policy if exists tenant_membership_read on ticketing.tenant_memberships;
create policy tenant_membership_read on ticketing.tenant_memberships for select using (
  user_id = auth.uid()
  or ticketing.has_tenant_role(tenant_id, array['OWNER','ADMIN']::ticketing.membership_role[])
);
create policy tenant_membership_insert on ticketing.tenant_memberships for insert with check (
  ticketing.has_tenant_role(tenant_id, array['OWNER','ADMIN']::ticketing.membership_role[])
);
create policy tenant_membership_update on ticketing.tenant_memberships for update
using (ticketing.has_tenant_role(tenant_id, array['OWNER','ADMIN']::ticketing.membership_role[]))
with check (ticketing.has_tenant_role(tenant_id, array['OWNER','ADMIN']::ticketing.membership_role[]));
create policy tenant_membership_delete on ticketing.tenant_memberships for delete using (
  ticketing.has_tenant_role(tenant_id, array['OWNER']::ticketing.membership_role[])
  and user_id <> auth.uid()
);

create policy organizer_event_write on ticketing.events for all
using (ticketing.has_tenant_role(tenant_id, array['OWNER','ADMIN','OPERATOR']::ticketing.membership_role[]))
with check (ticketing.has_tenant_role(tenant_id, array['OWNER','ADMIN','OPERATOR']::ticketing.membership_role[]));
create policy organizer_sales_session_write on ticketing.sales_sessions for all
using (ticketing.has_tenant_role(tenant_id, array['OWNER','ADMIN','OPERATOR']::ticketing.membership_role[]))
with check (ticketing.has_tenant_role(tenant_id, array['OWNER','ADMIN','OPERATOR']::ticketing.membership_role[]));
create policy organizer_ticket_type_write on ticketing.ticket_types for all
using (ticketing.has_tenant_role(tenant_id, array['OWNER','ADMIN','OPERATOR']::ticketing.membership_role[]))
with check (ticketing.has_tenant_role(tenant_id, array['OWNER','ADMIN','OPERATOR']::ticketing.membership_role[]));

create policy platform_audit_read on ticketing.audit_log for select using (
  public.is_platform_staff(array['support','platform_admin'])
  or (tenant_id is not null and ticketing.has_tenant_role(tenant_id, array['OWNER','ADMIN','VIEWER']::ticketing.membership_role[]))
);

alter table ticketing.audit_log enable row level security;
grant select on ticketing.tenant_memberships, ticketing.audit_log to authenticated;
grant insert, update, delete on ticketing.tenant_memberships to authenticated;
grant insert, update, delete on ticketing.events, ticketing.sales_sessions, ticketing.ticket_types to authenticated;

create or replace function ticketing.write_audit(
  target_tenant uuid,
  action_name text,
  target_type text,
  target_id uuid,
  detail jsonb default '{}'::jsonb
)
returns bigint
language plpgsql
security definer
set search_path = ticketing, public
as $$
declare inserted_id bigint;
begin
  if auth.uid() is null then raise exception 'authentication required'; end if;
  insert into ticketing.audit_log (tenant_id, actor_user_id, action, aggregate_type, aggregate_id, metadata)
  values (target_tenant, auth.uid(), action_name, target_type, target_id, coalesce(detail, '{}'::jsonb))
  returning id into inserted_id;
  return inserted_id;
end;
$$;

revoke all on function ticketing.write_audit(uuid, text, text, uuid, jsonb) from public;
grant execute on function ticketing.write_audit(uuid, text, text, uuid, jsonb) to authenticated;


-- ==========================================
-- FILE: 006_buyer_experience.sql
-- ==========================================
-- Phase 4: durable buyer-facing records, ticket issuance, notifications and consent.

create type ticketing.ticket_status as enum ('ACTIVE', 'REDEEMED', 'VOID', 'REFUNDED');

create table if not exists ticketing.tickets (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references ticketing.tenants(id),
  order_id uuid not null,
  order_item_id uuid not null references ticketing.order_items(id),
  owner_user_id uuid not null references auth.users(id),
  sequence integer not null check (sequence > 0),
  ticket_code text not null unique default ('WT-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 16))),
  status ticketing.ticket_status not null default 'ACTIVE',
  issued_at timestamptz not null default now(),
  redeemed_at timestamptz,
  redeemed_by uuid references auth.users(id),
  gate text,
  foreign key (tenant_id, order_id) references ticketing.orders(tenant_id, id),
  unique (order_item_id, sequence)
);

create table if not exists ticketing.ticket_qr_tokens (
  token_hash text primary key,
  ticket_id uuid not null references ticketing.tickets(id) on delete cascade,
  owner_user_id uuid not null references auth.users(id),
  expires_at timestamptz not null,
  consumed_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists ticket_qr_tokens_expiry_idx on ticketing.ticket_qr_tokens(expires_at) where consumed_at is null;

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  category text not null check (category in ('war','order','system','promo','support')),
  title text not null,
  body text not null,
  action_href text,
  read_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists notifications_user_created_idx on public.notifications(user_id, created_at desc);

create table if not exists public.support_cases (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id),
  order_id uuid,
  subject text not null,
  description text not null,
  status text not null default 'OPEN' check (status in ('OPEN','IN_REVIEW','RESOLVED','CLOSED')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.newsletter_subscriptions (
  email text primary key check (email = lower(email)),
  user_id uuid references auth.users(id),
  status text not null default 'PENDING' check (status in ('PENDING','ACTIVE','UNSUBSCRIBED')),
  consent_at timestamptz not null default now(),
  confirmed_at timestamptz,
  unsubscribe_token uuid not null default gen_random_uuid()
);

create table if not exists public.legal_documents (
  kind text not null check (kind in ('TERMS','PRIVACY','REFUND')),
  version text not null,
  title text not null,
  content_markdown text not null,
  effective_at timestamptz not null,
  published_at timestamptz,
  primary key (kind, version)
);

create table if not exists public.legal_consents (
  user_id uuid not null references auth.users(id),
  kind text not null,
  version text not null,
  accepted_at timestamptz not null default now(),
  ip_hash text,
  primary key (user_id, kind, version),
  foreign key (kind, version) references public.legal_documents(kind, version)
);

insert into public.legal_documents (kind, version, title, content_markdown, effective_at, published_at) values
('TERMS', '2026-08-29', 'Syarat dan Ketentuan War Ticket', 'Ketentuan pembelian, antrean, pembayaran, penggunaan tiket, dan kewajiban pengguna.', '2026-08-29', now()),
('PRIVACY', '2026-08-29', 'Kebijakan Privasi War Ticket', 'Data diproses secara terbatas untuk autentikasi, transaksi, keamanan tiket, dan dukungan pengguna.', '2026-08-29', now()),
('REFUND', '2026-08-29', 'Kebijakan Refund War Ticket', 'Refund hanya diproses setelah status provider dan kebijakan event terverifikasi.', '2026-08-29', now())
on conflict (kind, version) do nothing;

create or replace function ticketing.issue_paid_order_tickets()
returns trigger
language plpgsql
security definer
set search_path = ticketing, public
as $$
begin
  if new.status = 'PAID' and old.status is distinct from 'PAID' then
    insert into ticketing.tickets (tenant_id, order_id, order_item_id, owner_user_id, sequence)
    select item.tenant_id, item.order_id, item.id, new.user_id, generated.sequence
    from ticketing.order_items item
    cross join lateral generate_series(1, item.quantity) generated(sequence)
    where item.tenant_id = new.tenant_id and item.order_id = new.id
    on conflict (order_item_id, sequence) do nothing;

    insert into public.notifications (user_id, category, title, body, action_href)
    values (new.user_id, 'order', 'E-ticket sudah diterbitkan',
      'Pembayaran terverifikasi dan tiket resmi tersedia di akun Anda.', '/my-tickets');
  end if;
  return new;
end;
$$;

drop trigger if exists orders_issue_tickets on ticketing.orders;
create trigger orders_issue_tickets after update of status on ticketing.orders
for each row execute function ticketing.issue_paid_order_tickets();

alter table ticketing.tickets enable row level security;
alter table ticketing.ticket_qr_tokens enable row level security;
alter table public.notifications enable row level security;
alter table public.support_cases enable row level security;
alter table public.newsletter_subscriptions enable row level security;
alter table public.legal_documents enable row level security;
alter table public.legal_consents enable row level security;

drop policy if exists ticket_owner_read on ticketing.tickets;
create policy ticket_owner_read on ticketing.tickets for select using (owner_user_id = auth.uid());

drop policy if exists qr_owner_read on ticketing.ticket_qr_tokens;
create policy qr_owner_read on ticketing.ticket_qr_tokens for select using (owner_user_id = auth.uid());

drop policy if exists notification_owner_all on public.notifications;
create policy notification_owner_all on public.notifications for all using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists support_owner_read on public.support_cases;
create policy support_owner_read on public.support_cases for select using (user_id = auth.uid() or public.is_platform_staff(array['support','platform_admin']));

drop policy if exists support_owner_insert on public.support_cases;
create policy support_owner_insert on public.support_cases for insert with check (user_id = auth.uid());

drop policy if exists legal_public_read on public.legal_documents;
create policy legal_public_read on public.legal_documents for select using (published_at is not null and effective_at <= now());

drop policy if exists consent_owner_all on public.legal_consents;
create policy consent_owner_all on public.legal_consents for all using (user_id = auth.uid()) with check (user_id = auth.uid());

grant select on ticketing.tickets, ticketing.ticket_qr_tokens to authenticated;
grant select, update on public.notifications to authenticated;
grant select, insert on public.support_cases to authenticated;
grant select on public.legal_documents to anon, authenticated;
grant select, insert on public.legal_consents to authenticated;


-- ==========================================
-- FILE: 007_organizer_operations.sql
-- ==========================================
-- Phase 5: organizer onboarding, drafts, controlled operations, and settlement records.

create table if not exists public.organizer_applications (
  id uuid primary key default gen_random_uuid(),
  applicant_user_id uuid references auth.users(id),
  company_name text not null,
  pic_name text not null,
  email text not null,
  phone text not null,
  estimated_attendees integer check (estimated_attendees > 0),
  event_genre text,
  status text not null default 'SUBMITTED' check (status in ('SUBMITTED','IN_REVIEW','APPROVED','REJECTED')),
  reviewed_by uuid references auth.users(id),
  reviewed_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists ticketing.event_drafts (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references ticketing.tenants(id),
  created_by uuid not null references auth.users(id),
  payload jsonb not null default '{}'::jsonb,
  version bigint not null default 1,
  submitted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table ticketing.events
  add column if not exists approval_status text not null default 'DRAFT'
    check (approval_status in ('DRAFT','SUBMITTED','APPROVED','REJECTED','PUBLISHED','CANCELLED')),
  add column if not exists description text,
  add column if not exists require_nik boolean not null default false,
  add column if not exists approved_by uuid references auth.users(id),
  add column if not exists approved_at timestamptz;

create table if not exists ticketing.organizer_mutation_keys (
  tenant_id uuid not null references ticketing.tenants(id),
  actor_user_id uuid not null references auth.users(id),
  key text not null,
  operation text not null,
  response jsonb,
  created_at timestamptz not null default now(),
  primary key (tenant_id, actor_user_id, key)
);

create table if not exists ticketing.broadcasts (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references ticketing.tenants(id),
  event_id uuid not null,
  author_user_id uuid not null references auth.users(id),
  message text not null,
  created_at timestamptz not null default now(),
  foreign key (tenant_id, event_id) references ticketing.events(tenant_id, id)
);

create table if not exists ticketing.settlements (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references ticketing.tenants(id),
  event_id uuid not null,
  gross_amount bigint not null check (gross_amount >= 0),
  fees bigint not null check (fees >= 0),
  net_amount bigint generated always as (gross_amount - fees) stored,
  status text not null default 'CALCULATING' check (status in ('CALCULATING','PAYABLE','PAYOUT_REQUESTED','PAID','HELD')),
  payout_requested_by uuid references auth.users(id),
  payout_requested_at timestamptz,
  paid_at timestamptz,
  created_at timestamptz not null default now(),
  foreign key (tenant_id, event_id) references ticketing.events(tenant_id, id),
  unique (tenant_id, event_id)
);

alter table public.organizer_applications enable row level security;
alter table ticketing.event_drafts enable row level security;
alter table ticketing.broadcasts enable row level security;
alter table ticketing.settlements enable row level security;

drop policy if exists organizer_application_owner_read on public.organizer_applications;
create policy organizer_application_owner_read on public.organizer_applications for select using (applicant_user_id = auth.uid() or public.is_platform_staff(array['platform_admin']));

drop policy if exists organizer_application_insert on public.organizer_applications;
create policy organizer_application_insert on public.organizer_applications for insert with check (applicant_user_id = auth.uid());

drop policy if exists event_draft_member_all on ticketing.event_drafts;
create policy event_draft_member_all on ticketing.event_drafts for all using (ticketing.has_tenant_role(tenant_id, array['OWNER','ADMIN','OPERATOR']::ticketing.membership_role[])) with check (ticketing.has_tenant_role(tenant_id, array['OWNER','ADMIN','OPERATOR']::ticketing.membership_role[]));

drop policy if exists broadcast_member_read on ticketing.broadcasts;
create policy broadcast_member_read on ticketing.broadcasts for select using (ticketing.has_tenant_role(tenant_id, array['OWNER','ADMIN','OPERATOR','FINANCE','VIEWER']::ticketing.membership_role[]));

drop policy if exists settlement_finance_read on ticketing.settlements;
create policy settlement_finance_read on ticketing.settlements for select using (ticketing.has_tenant_role(tenant_id, array['OWNER','ADMIN','FINANCE']::ticketing.membership_role[]));

grant select, insert on public.organizer_applications to authenticated;
grant select, insert, update on ticketing.event_drafts to authenticated;
grant select on ticketing.broadcasts, ticketing.settlements to authenticated;


-- ==========================================
-- FILE: 008_admin_governance.sql
-- ==========================================
-- Phase 6: disputes, provider-verified refunds, and admin governance.

create table if not exists public.disputes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id),
  order_id uuid not null,
  support_case_id uuid references public.support_cases(id),
  reason text not null,
  evidence jsonb not null default '[]'::jsonb,
  status text not null default 'OPEN' check (status in ('OPEN','INVESTIGATING','REFUND_PENDING','RESOLVED','REJECTED')),
  resolution text,
  assigned_to uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, order_id, reason)
);

create table if not exists ticketing.refund_requests (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references ticketing.tenants(id),
  dispute_id uuid not null references public.disputes(id),
  order_id uuid not null,
  actor_user_id uuid not null references auth.users(id),
  idempotency_key text not null,
  refund_key text not null unique,
  amount integer not null check (amount > 0),
  reason text not null,
  status text not null default 'REQUESTED' check (status in ('REQUESTED','PROVIDER_ACCEPTED','PROVIDER_UNKNOWN','REJECTED')),
  provider_response jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (actor_user_id, idempotency_key)
);

alter table public.disputes enable row level security;
alter table ticketing.refund_requests enable row level security;

drop policy if exists dispute_owner_read on public.disputes;
create policy dispute_owner_read on public.disputes for select using (user_id = auth.uid() or public.is_platform_staff(array['support','platform_admin']));

drop policy if exists dispute_owner_insert on public.disputes;
create policy dispute_owner_insert on public.disputes for insert with check (user_id = auth.uid());

drop policy if exists refund_staff_read on ticketing.refund_requests for select using (public.is_platform_staff(array['support','platform_admin']));
create policy refund_staff_read on ticketing.refund_requests for select using (public.is_platform_staff(array['support','platform_admin']));

grant select, insert on public.disputes to authenticated;
grant select on ticketing.refund_requests to authenticated;


-- ==========================================
-- FILE: 009_engagement_elite.sql
-- ==========================================
-- Phase 7: promotion validation, community, event subscriptions, and Elite presale separation.

create table if not exists public.promo_campaigns (
  id uuid primary key default gen_random_uuid(),
  code text not null unique check (code = upper(code)),
  title text not null,
  discount_type text not null check (discount_type in ('FIXED','PERCENT')),
  discount_value integer not null check (discount_value > 0),
  max_discount integer,
  minimum_spend integer not null default 0,
  quota integer not null check (quota >= 0),
  redeemed integer not null default 0 check (redeemed between 0 and quota),
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  enabled boolean not null default true,
  created_at timestamptz not null default now(),
  check (starts_at < ends_at)
);

create table if not exists public.promo_redemptions (
  promo_id uuid not null references public.promo_campaigns(id),
  user_id uuid not null references auth.users(id),
  order_id uuid not null,
  discount_amount integer not null check (discount_amount > 0),
  created_at timestamptz not null default now(),
  primary key (promo_id, user_id, order_id)
);

create table if not exists public.community_messages (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id),
  body text not null check (length(body) between 1 and 500),
  moderation_status text not null default 'VISIBLE' check (moderation_status in ('VISIBLE','HIDDEN','REVIEW')),
  created_at timestamptz not null default now()
);
create index if not exists community_messages_visible_idx on public.community_messages(created_at desc) where moderation_status = 'VISIBLE';

create table if not exists public.event_subscriptions (
  user_id uuid not null references auth.users(id),
  event_id uuid not null references public.concerts(id) on delete cascade,
  channels text[] not null default array['EMAIL'],
  created_at timestamptz not null default now(),
  primary key (user_id, event_id)
);

create table if not exists public.elite_memberships (
  user_id uuid primary key references auth.users(id),
  tier text not null check (tier in ('ELITE','VANGUARD')),
  status text not null check (status in ('ACTIVE','PAST_DUE','CANCELLED','EXPIRED')),
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  provider_subscription_id text unique
);

create table if not exists ticketing.elite_presales (
  sales_session_id uuid primary key references ticketing.sales_sessions(id),
  required_tier text not null check (required_tier in ('ELITE','VANGUARD')),
  allocation integer not null check (allocation > 0),
  created_at timestamptz not null default now()
);

create table if not exists public.concierge_cases (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id),
  subject text not null,
  description text not null,
  status text not null default 'OPEN' check (status in ('OPEN','IN_PROGRESS','RESOLVED','CLOSED')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.promo_campaigns enable row level security;
alter table public.promo_redemptions enable row level security;
alter table public.community_messages enable row level security;
alter table public.event_subscriptions enable row level security;
alter table public.elite_memberships enable row level security;
alter table ticketing.elite_presales enable row level security;
alter table public.concierge_cases enable row level security;

drop policy if exists promo_public_read on public.promo_campaigns;
create policy promo_public_read on public.promo_campaigns for select using (enabled and starts_at <= now() and ends_at > now());

drop policy if exists promo_redemption_owner_read on public.promo_redemptions;
create policy promo_redemption_owner_read on public.promo_redemptions for select using (user_id = auth.uid());

drop policy if exists community_visible_read on public.community_messages;
create policy community_visible_read on public.community_messages for select using (moderation_status = 'VISIBLE' or user_id = auth.uid() or public.is_platform_staff(array['support','platform_admin']));

drop policy if exists community_owner_insert on public.community_messages;
create policy community_owner_insert on public.community_messages for insert with check (user_id = auth.uid());

drop policy if exists subscription_owner_all on public.event_subscriptions;
create policy subscription_owner_all on public.event_subscriptions for all using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists elite_owner_read on public.elite_memberships;
create policy elite_owner_read on public.elite_memberships for select using (user_id = auth.uid());

drop policy if exists concierge_owner_all on public.concierge_cases;
create policy concierge_owner_all on public.concierge_cases for all using (user_id = auth.uid()) with check (user_id = auth.uid());

grant select on public.promo_campaigns, public.promo_redemptions, public.community_messages, public.elite_memberships to authenticated;
grant insert on public.community_messages to authenticated;
grant select, insert, delete on public.event_subscriptions to authenticated;
grant select, insert on public.concierge_cases to authenticated;


