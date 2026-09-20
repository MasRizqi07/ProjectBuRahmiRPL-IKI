-- Give the serverless checkout path an explicit tenant owner without projecting
-- edge orders into the legacy reservation/order/payment-attempt aggregate.
alter table public.concerts
  add column if not exists tenant_id uuid references ticketing.tenants(id);

alter table ticketing.edge_orders
  add column if not exists tenant_id uuid references ticketing.tenants(id);

-- Existing canonical events already carry the authoritative tenant mapping.
update public.concerts concert
set tenant_id = event.tenant_id
from ticketing.events event
where event.id = concert.id
  and concert.tenant_id is distinct from event.tenant_id;

-- The dedicated 10K fixture is owned by the existing demo promoter tenant.
update public.concerts
set tenant_id = '11111111-1111-4111-8111-111111111111'
where title = 'WAR TICKET 10K GATE: 100-TICKET FIXTURE'
  and tenant_id is null
  and exists (
    select 1
    from ticketing.tenants
    where id = '11111111-1111-4111-8111-111111111111'
  );

update ticketing.edge_orders edge_order
set tenant_id = concert.tenant_id
from public.concerts concert
where concert.id = edge_order.event_id
  and edge_order.tenant_id is null
  and concert.tenant_id is not null;

-- This composite key makes it impossible for a tenant-scoped edge order to
-- reference an event owned by another tenant. Nullable legacy rows remain
-- readable but cannot resolve a payment context until explicitly backfilled.
create unique index if not exists concerts_tenant_id_id_idx
  on public.concerts(tenant_id, id);

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'edge_orders_tenant_event_fk'
      and conrelid = 'ticketing.edge_orders'::regclass
  ) then
    alter table ticketing.edge_orders
      add constraint edge_orders_tenant_event_fk
      foreign key (tenant_id, event_id)
      references public.concerts(tenant_id, id);
  end if;
end;
$$;

create index if not exists edge_orders_tenant_idx
  on ticketing.edge_orders(tenant_id);

