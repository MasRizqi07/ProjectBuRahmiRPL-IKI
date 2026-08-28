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
