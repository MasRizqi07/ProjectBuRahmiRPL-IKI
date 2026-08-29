-- Phase 6: disputes, provider-verified refunds, and admin governance.

create table public.disputes (
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

create table ticketing.refund_requests (
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
create policy dispute_owner_read on public.disputes for select using (user_id = auth.uid() or public.is_platform_staff(array['support','platform_admin']));
create policy dispute_owner_insert on public.disputes for insert with check (user_id = auth.uid());
create policy refund_staff_read on ticketing.refund_requests for select using (public.is_platform_staff(array['support','platform_admin']));
grant select, insert on public.disputes to authenticated;
grant select on ticketing.refund_requests to authenticated;
