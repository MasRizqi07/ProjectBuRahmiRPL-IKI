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
