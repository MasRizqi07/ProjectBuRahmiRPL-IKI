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