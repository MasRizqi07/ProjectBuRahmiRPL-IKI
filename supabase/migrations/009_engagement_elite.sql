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
