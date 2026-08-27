create role anon nologin;
create role authenticated nologin;
create role service_role nologin bypassrls;

create schema auth;

create table auth.users (
  id uuid primary key,
  raw_user_meta_data jsonb not null default '{}'
);

create function auth.uid()
returns uuid
language sql
stable
as $$
  select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid
$$;

comment on schema auth is
  'Minimal local migration harness only. Supabase Auth remains the production identity provider.';
