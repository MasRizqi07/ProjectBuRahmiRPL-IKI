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
