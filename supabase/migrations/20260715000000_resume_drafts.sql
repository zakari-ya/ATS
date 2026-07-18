-- Grounded tailored-resume drafts. The stored JSON contains only validated
-- selection and rewriting data; factual profile data remains in resume_profiles.

create table if not exists public.resume_drafts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  source_scan_id uuid not null references public.scans(id) on delete cascade,
  resume_profile_id uuid not null references public.resume_profiles(id) on delete cascade,
  schema_version integer not null default 1 check (schema_version = 1),
  prompt_version integer not null default 1 check (prompt_version = 1),
  draft_data jsonb not null check (jsonb_typeof(draft_data) = 'object'),
  validation_warnings jsonb not null default '[]'::jsonb
    check (jsonb_typeof(validation_warnings) = 'array'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint resume_drafts_user_source_scan_unique unique (user_id, source_scan_id)
);

create index if not exists resume_drafts_user_created_at_idx
  on public.resume_drafts (user_id, created_at desc);

create index if not exists resume_drafts_resume_profile_idx
  on public.resume_drafts (resume_profile_id);

drop trigger if exists set_resume_drafts_updated_at on public.resume_drafts;

create trigger set_resume_drafts_updated_at
before update on public.resume_drafts
for each row
execute function public.set_updated_at();

alter table public.resume_drafts enable row level security;

drop policy if exists "resume_drafts_select_own" on public.resume_drafts;
create policy "resume_drafts_select_own"
on public.resume_drafts
for select
to authenticated
using (
  (select auth.uid()) = user_id
  and exists (
    select 1 from public.scans s
    where s.id = source_scan_id
      and s.user_id = (select auth.uid())
  )
  and exists (
    select 1 from public.resume_profiles rp
    where rp.id = resume_profile_id
      and rp.user_id = (select auth.uid())
      and rp.source_scan_id = source_scan_id
  )
);

drop policy if exists "resume_drafts_insert_own_completed_scan" on public.resume_drafts;
create policy "resume_drafts_insert_own_completed_scan"
on public.resume_drafts
for insert
to authenticated
with check (
  (select auth.uid()) = user_id
  and exists (
    select 1 from public.scans s
    where s.id = source_scan_id
      and s.user_id = (select auth.uid())
      and s.current_status = 'completed'
  )
  and exists (
    select 1 from public.resume_profiles rp
    where rp.id = resume_profile_id
      and rp.user_id = (select auth.uid())
      and rp.source_scan_id = source_scan_id
  )
);

drop policy if exists "resume_drafts_update_own_completed_scan" on public.resume_drafts;
create policy "resume_drafts_update_own_completed_scan"
on public.resume_drafts
for update
to authenticated
using (
  (select auth.uid()) = user_id
  and exists (
    select 1 from public.scans s
    where s.id = source_scan_id
      and s.user_id = (select auth.uid())
      and s.current_status = 'completed'
  )
  and exists (
    select 1 from public.resume_profiles rp
    where rp.id = resume_profile_id
      and rp.user_id = (select auth.uid())
      and rp.source_scan_id = source_scan_id
  )
)
with check (
  (select auth.uid()) = user_id
  and exists (
    select 1 from public.scans s
    where s.id = source_scan_id
      and s.user_id = (select auth.uid())
      and s.current_status = 'completed'
  )
  and exists (
    select 1 from public.resume_profiles rp
    where rp.id = resume_profile_id
      and rp.user_id = (select auth.uid())
      and rp.source_scan_id = source_scan_id
  )
);

drop policy if exists "resume_drafts_delete_own" on public.resume_drafts;
create policy "resume_drafts_delete_own"
on public.resume_drafts
for delete
to authenticated
using (
  (select auth.uid()) = user_id
  and exists (
    select 1 from public.scans s
    where s.id = source_scan_id
      and s.user_id = (select auth.uid())
  )
  and exists (
    select 1 from public.resume_profiles rp
    where rp.id = resume_profile_id
      and rp.user_id = (select auth.uid())
      and rp.source_scan_id = source_scan_id
  )
);

grant select, insert, update, delete on public.resume_drafts to authenticated;
