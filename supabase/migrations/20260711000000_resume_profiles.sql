-- Trusted resume-profile foundation for the future resume builder.
-- profile_data contains structured, user-owned factual data only.

create table if not exists public.resume_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  source_scan_id uuid not null references public.scans(id) on delete cascade,
  schema_version integer not null default 1 check (schema_version = 1),
  profile_data jsonb not null check (jsonb_typeof(profile_data) = 'object'),
  review_status text not null default 'needs_review'
    check (review_status in ('needs_review', 'partially_confirmed', 'confirmed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint resume_profiles_user_source_scan_unique unique (user_id, source_scan_id)
);

create index if not exists resume_profiles_user_created_at_idx
  on public.resume_profiles (user_id, created_at desc);

create index if not exists resume_profiles_source_scan_idx
  on public.resume_profiles (source_scan_id);

drop trigger if exists set_resume_profiles_updated_at on public.resume_profiles;

create trigger set_resume_profiles_updated_at
before update on public.resume_profiles
for each row
execute function public.set_updated_at();

alter table public.resume_profiles enable row level security;

drop policy if exists "resume_profiles_select_own" on public.resume_profiles;
create policy "resume_profiles_select_own"
on public.resume_profiles
for select
to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists "resume_profiles_insert_own_completed_scan" on public.resume_profiles;
create policy "resume_profiles_insert_own_completed_scan"
on public.resume_profiles
for insert
to authenticated
with check (
  (select auth.uid()) = user_id
  and exists (
    select 1
    from public.scans s
    where s.id = source_scan_id
      and s.user_id = (select auth.uid())
      and s.current_status = 'completed'
  )
);

drop policy if exists "resume_profiles_update_own_completed_scan" on public.resume_profiles;
create policy "resume_profiles_update_own_completed_scan"
on public.resume_profiles
for update
to authenticated
using (
  (select auth.uid()) = user_id
  and exists (
    select 1
    from public.scans s
    where s.id = source_scan_id
      and s.user_id = (select auth.uid())
      and s.current_status = 'completed'
  )
)
with check (
  (select auth.uid()) = user_id
  and exists (
    select 1
    from public.scans s
    where s.id = source_scan_id
      and s.user_id = (select auth.uid())
      and s.current_status = 'completed'
  )
);

drop policy if exists "resume_profiles_delete_own" on public.resume_profiles;
create policy "resume_profiles_delete_own"
on public.resume_profiles
for delete
to authenticated
using ((select auth.uid()) = user_id);

grant select, insert, update, delete on public.resume_profiles to authenticated;
