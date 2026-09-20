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
