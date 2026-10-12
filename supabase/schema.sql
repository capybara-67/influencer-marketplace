create extension if not exists "pgcrypto";

create type public.user_role as enum ('business', 'influencer');
create type public.application_status as enum ('pending', 'accepted', 'rejected', 'completed');
create type public.offer_status as enum ('open', 'closed');

create table public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  role public.user_role not null,
  full_name text,
  created_at timestamptz not null default now()
);

create table public.business_profiles (
  user_id uuid primary key references public.users(id) on delete cascade,
  business_name text not null,
  description text,
  city text default 'Ulaanbaatar',
  instagram_handle text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.influencer_profiles (
  user_id uuid primary key references public.users(id) on delete cascade,
  display_name text not null,
  bio text,
  instagram_handle text,
  tiktok_handle text,
  facebook_handle text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.offers (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.business_profiles(user_id) on delete cascade,
  title text not null,
  description text not null,
  compensation text,
  location text default 'Ulaanbaatar',
  status public.offer_status not null default 'open',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.applications (
  id uuid primary key default gen_random_uuid(),
  offer_id uuid not null references public.offers(id) on delete cascade,
  influencer_id uuid not null references public.influencer_profiles(user_id) on delete cascade,
  pitch text,
  status public.application_status not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (offer_id, influencer_id)
);

create table public.deals (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null unique references public.applications(id) on delete cascade,
  offer_id uuid not null references public.offers(id) on delete cascade,
  business_id uuid not null references public.business_profiles(user_id) on delete cascade,
  influencer_id uuid not null references public.influencer_profiles(user_id) on delete cascade,
  status public.application_status not null default 'accepted',
  completed_at timestamptz,
  created_at timestamptz not null default now()
);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.users (id, email, role, full_name)
  values (
    new.id,
    new.email,
    coalesce((new.raw_user_meta_data ->> 'role')::public.user_role, 'influencer'),
    new.raw_user_meta_data ->> 'full_name'
  );

  if coalesce((new.raw_user_meta_data ->> 'role')::public.user_role, 'influencer') = 'business' then
    insert into public.business_profiles (user_id, business_name)
    values (new.id, coalesce(new.raw_user_meta_data ->> 'full_name', 'New business'));
  else
    insert into public.influencer_profiles (user_id, display_name)
    values (new.id, coalesce(new.raw_user_meta_data ->> 'full_name', 'New influencer'));
  end if;

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger set_business_profiles_updated_at
  before update on public.business_profiles
  for each row execute procedure public.set_updated_at();

create trigger set_influencer_profiles_updated_at
  before update on public.influencer_profiles
  for each row execute procedure public.set_updated_at();

create trigger set_offers_updated_at
  before update on public.offers
  for each row execute procedure public.set_updated_at();

create trigger set_applications_updated_at
  before update on public.applications
  for each row execute procedure public.set_updated_at();

alter table public.users enable row level security;
alter table public.business_profiles enable row level security;
alter table public.influencer_profiles enable row level security;
alter table public.offers enable row level security;
alter table public.applications enable row level security;
alter table public.deals enable row level security;

create policy "users can read own record"
on public.users
for select
using ((select auth.uid()) = id);

create policy "users can update own record"
on public.users
for update
to authenticated
using ((select auth.uid()) = id)
with check ((select auth.uid()) = id);

create policy "business profiles visible to authenticated users"
on public.business_profiles
for select
to authenticated
using (true);

create policy "business user can manage own profile"
on public.business_profiles
for all
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id and exists (select 1 from public.users where id = (select auth.uid()) and role = 'business'));

create policy "influencer profiles visible to authenticated users"
on public.influencer_profiles
for select
to authenticated
using (true);

create policy "influencer can manage own profile"
on public.influencer_profiles
for all
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id and exists (select 1 from public.users where id = (select auth.uid()) and role = 'influencer'));

create policy "authenticated users can view open offers"
on public.offers
for select
to authenticated
using (status = 'open' or business_id = (select auth.uid()));

create policy "business users can insert offers"
on public.offers
for insert
to authenticated
with check (
  (select auth.uid()) = business_id
  and exists (
    select 1 from public.users
    where id = (select auth.uid()) and role = 'business'
  )
);

create policy "business users can update own offers"
on public.offers
for update
to authenticated
using ((select auth.uid()) = business_id)
with check ((select auth.uid()) = business_id);

create policy "business users can delete own offers"
on public.offers
for delete
to authenticated
using ((select auth.uid()) = business_id);

create policy "influencers can create own applications"
on public.applications
for insert
to authenticated
with check (
  (select auth.uid()) = influencer_id
  and exists (
    select 1 from public.users
    where id = (select auth.uid()) and role = 'influencer'
  )
  and exists (select 1 from public.offers o where o.id = offer_id and o.status = 'open')
);

create policy "participants can read applications"
on public.applications
for select
to authenticated
using (
  (select auth.uid()) = influencer_id
  or exists (
    select 1
    from public.offers o
    where o.id = offer_id and o.business_id = (select auth.uid())
  )
);

create policy "business can update applications on own offers"
on public.applications
for update
to authenticated
using (
  exists (
    select 1 from public.offers o
    where o.id = offer_id and o.business_id = (select auth.uid())
  )
)
with check (
  exists (
    select 1 from public.offers o
    where o.id = offer_id and o.business_id = (select auth.uid())
  )
);

create policy "deals visible to participants"
on public.deals
for select
to authenticated
using ((select auth.uid()) = business_id or (select auth.uid()) = influencer_id);

create or replace function public.create_deal_on_accept()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  offer_owner uuid;
begin
  if new.status = 'accepted' and old.status is distinct from new.status then
    select business_id into offer_owner from public.offers where id = new.offer_id;

    insert into public.deals (application_id, offer_id, business_id, influencer_id, status)
    values (new.id, new.offer_id, offer_owner, new.influencer_id, 'accepted')
    on conflict (application_id) do update set status = excluded.status;
  end if;

  if new.status = 'completed' and old.status is distinct from new.status then
    update public.deals
    set status = 'completed', completed_at = now()
    where application_id = new.id;
  end if;

  return new;
end;
$$;

create trigger create_deal_after_application_update
  after update on public.applications
  for each row execute procedure public.create_deal_on_accept();

-- Keys used by foreign-key lookups, feed queries, and ownership policies.
create index offers_business_id_idx on public.offers (business_id);
create index offers_open_feed_idx on public.offers (created_at desc) where status = 'open';
create index applications_influencer_id_idx on public.applications (influencer_id);
create index deals_business_id_idx on public.deals (business_id);
create index deals_influencer_id_idx on public.deals (influencer_id);

-- RLS controls rows; column grants keep identities and signup roles immutable.
revoke all on public.users, public.business_profiles, public.influencer_profiles,
  public.offers, public.applications, public.deals from anon, authenticated;
grant usage on schema public to authenticated;
grant select on public.users, public.business_profiles, public.influencer_profiles,
  public.offers, public.applications, public.deals to authenticated;
grant update (full_name) on public.users to authenticated;
grant insert, update, delete on public.business_profiles, public.influencer_profiles to authenticated;
grant insert, delete on public.offers to authenticated;
grant update (title, description, compensation, location, status) on public.offers to authenticated;
grant insert (offer_id, influencer_id, pitch) on public.applications to authenticated;
grant update (status) on public.applications to authenticated;

-- These privileged functions are trigger-only; clients cannot call them as RPCs.
revoke all on function public.handle_new_user() from public, anon, authenticated;
revoke all on function public.create_deal_on_accept() from public, anon, authenticated;

create or replace function public.validate_application_transition()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.status is distinct from old.status and not (
    (old.status = 'pending' and new.status in ('accepted', 'rejected')) or
    (old.status = 'accepted' and new.status = 'completed')
  ) then
    raise exception 'Invalid application status transition';
  end if;
  return new;
end;
$$;
create trigger validate_application_status
  before update of status on public.applications
  for each row execute function public.validate_application_transition();
