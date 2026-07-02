-- ATS CV Checker - Supabase Database Schema
-- Run this file in Supabase SQL Editor.
-- It creates: profiles, scans, scan_results, scan_status, usage_counters,
-- RLS policies, updated_at triggers, user profile trigger, and a private CV storage bucket.

-- =========================================================
-- 1. Extensions
-- =========================================================

create extension if not exists pgcrypto;

-- =========================================================
-- 2. Shared helpers
-- =========================================================

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- =========================================================
-- 3. Profiles
-- =========================================================

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  full_name text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists set_profiles_updated_at on public.profiles;

create trigger set_profiles_updated_at
before update on public.profiles
for each row
execute function public.set_updated_at();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (
    id,
    email,
    full_name,
    avatar_url
  )
  values (
    new.id,
    new.email,
    coalesce(
      new.raw_user_meta_data ->> 'full_name',
      new.raw_user_meta_data ->> 'name'
    ),
    new.raw_user_meta_data ->> 'avatar_url'
  )
  on conflict (id) do update
  set
    email = excluded.email,
    full_name = coalesce(public.profiles.full_name, excluded.full_name),
    avatar_url = coalesce(public.profiles.avatar_url, excluded.avatar_url),
    updated_at = now();

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
after insert on auth.users
for each row
execute function public.handle_new_user();

-- =========================================================
-- 4. Scans
-- Small table for dashboard/history.
-- Heavy data stays in scan_results.
-- =========================================================

create table if not exists public.scans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,

  job_title text,

  cv_storage_path text,
  cv_file_name text,
  cv_file_size integer check (cv_file_size is null or cv_file_size between 1 and 5242880),
  cv_content_type text check (cv_content_type is null or cv_content_type = 'application/pdf'),

  current_status text not null default 'created'
    check (
      current_status in (
        'created',
        'uploading',
        'uploaded',
        'validating_file',
        'extracting_text',
        'analyzing',
        'scoring',
        'completed',
        'failed',
        'deleted'
      )
    ),

  final_score numeric(5,2) check (final_score is null or (final_score >= 0 and final_score <= 100)),
  final_label text
    check (
      final_label is null or final_label in (
        'great_match',
        'good_match',
        'needs_improvement',
        'low_match'
      )
    ),

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  completed_at timestamptz,
  deleted_at timestamptz
);

create index if not exists scans_user_created_at_idx
on public.scans (user_id, created_at desc);

create index if not exists scans_user_status_idx
on public.scans (user_id, current_status);

create index if not exists scans_user_deleted_at_idx
on public.scans (user_id, deleted_at);

drop trigger if exists set_scans_updated_at on public.scans;

create trigger set_scans_updated_at
before update on public.scans
for each row
execute function public.set_updated_at();

-- =========================================================
-- 5. Scan Results
-- Heavy result table. One row per scan.
-- Stores extracted text, AI JSON, score breakdown, feedback.
-- =========================================================

create table if not exists public.scan_results (
  id uuid primary key default gen_random_uuid(),
  scan_id uuid not null references public.scans(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,

  job_description text not null check (char_length(job_description) between 30 and 20000),
  cv_extracted_text text check (cv_extracted_text is null or char_length(cv_extracted_text) <= 100000),
  cv_text_char_count integer check (cv_text_char_count is null or cv_text_char_count >= 0),

  ai_json jsonb,
  ai_schema_version text not null default 'v1',
  ai_validation_status text not null default 'pending'
    check (ai_validation_status in ('pending', 'valid', 'invalid')),

  final_score numeric(5,2) check (final_score is null or (final_score >= 0 and final_score <= 100)),
  final_label text
    check (
      final_label is null or final_label in (
        'great_match',
        'good_match',
        'needs_improvement',
        'low_match'
      )
    ),

  score_breakdown jsonb not null default '{}'::jsonb,
  matched_skills jsonb not null default '[]'::jsonb,
  missing_required_skills jsonb not null default '[]'::jsonb,
  missing_preferred_skills jsonb not null default '[]'::jsonb,
  strong_points jsonb not null default '[]'::jsonb,
  weak_points jsonb not null default '[]'::jsonb,
  recommendations jsonb not null default '[]'::jsonb,
  applied_caps jsonb not null default '[]'::jsonb,

  prompt_version text not null default 'v1',
  score_version text not null default 'v1',

  error_code text,
  error_message text,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint scan_results_one_result_per_scan unique (scan_id)
);

create index if not exists scan_results_scan_id_idx
on public.scan_results (scan_id);

create index if not exists scan_results_user_created_at_idx
on public.scan_results (user_id, created_at desc);

drop trigger if exists set_scan_results_updated_at on public.scan_results;

create trigger set_scan_results_updated_at
before update on public.scan_results
for each row
execute function public.set_updated_at();

-- =========================================================
-- 6. Scan Status
-- Timeline/progress table.
-- Keep scans.current_status for fast dashboard queries.
-- Keep scan_status for detailed progress/debug timeline.
-- =========================================================

create table if not exists public.scan_status (
  id uuid primary key default gen_random_uuid(),
  scan_id uuid not null references public.scans(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,

  status text not null,
  message text,
  safe_metadata jsonb not null default '{}'::jsonb,

  created_at timestamptz not null default now()
);

create index if not exists scan_status_scan_created_at_idx
on public.scan_status (scan_id, created_at asc);

create index if not exists scan_status_user_created_at_idx
on public.scan_status (user_id, created_at desc);

-- =========================================================
-- 7. Usage Counters
-- Used for free-plan limits and abuse protection.
-- Important: user should only read this table.
-- Server/service-role should update counters.
-- =========================================================

create table if not exists public.usage_counters (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  period_key text not null,

  scans_used integer not null default 0 check (scans_used >= 0),
  files_uploaded integer not null default 0 check (files_uploaded >= 0),
  ai_requests_used integer not null default 0 check (ai_requests_used >= 0),

  updated_at timestamptz not null default now(),

  constraint usage_counters_unique_user_period unique (user_id, period_key)
);

create index if not exists usage_counters_user_period_idx
on public.usage_counters (user_id, period_key);

drop trigger if exists set_usage_counters_updated_at on public.usage_counters;

create trigger set_usage_counters_updated_at
before update on public.usage_counters
for each row
execute function public.set_updated_at();

-- =========================================================
-- 8. Row Level Security
-- =========================================================

alter table public.profiles enable row level security;
alter table public.scans enable row level security;
alter table public.scan_results enable row level security;
alter table public.scan_status enable row level security;
alter table public.usage_counters enable row level security;

-- Profiles policies
drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own"
on public.profiles
for select
to authenticated
using (auth.uid() = id);

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own"
on public.profiles
for insert
to authenticated
with check (auth.uid() = id);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own"
on public.profiles
for update
to authenticated
using (auth.uid() = id)
with check (auth.uid() = id);

-- Scans policies
drop policy if exists "scans_select_own" on public.scans;
create policy "scans_select_own"
on public.scans
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "scans_insert_own" on public.scans;
create policy "scans_insert_own"
on public.scans
for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "scans_update_own" on public.scans;
create policy "scans_update_own"
on public.scans
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "scans_delete_own" on public.scans;
create policy "scans_delete_own"
on public.scans
for delete
to authenticated
using (auth.uid() = user_id);

-- Scan results policies
drop policy if exists "scan_results_select_own" on public.scan_results;
create policy "scan_results_select_own"
on public.scan_results
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "scan_results_insert_own_scan" on public.scan_results;
create policy "scan_results_insert_own_scan"
on public.scan_results
for insert
to authenticated
with check (
  auth.uid() = user_id
  and exists (
    select 1
    from public.scans s
    where s.id = scan_id
      and s.user_id = auth.uid()
  )
);

drop policy if exists "scan_results_update_own_scan" on public.scan_results;
create policy "scan_results_update_own_scan"
on public.scan_results
for update
to authenticated
using (
  auth.uid() = user_id
  and exists (
    select 1
    from public.scans s
    where s.id = scan_id
      and s.user_id = auth.uid()
  )
)
with check (
  auth.uid() = user_id
  and exists (
    select 1
    from public.scans s
    where s.id = scan_id
      and s.user_id = auth.uid()
  )
);

drop policy if exists "scan_results_delete_own" on public.scan_results;
create policy "scan_results_delete_own"
on public.scan_results
for delete
to authenticated
using (auth.uid() = user_id);

-- Scan status policies
drop policy if exists "scan_status_select_own" on public.scan_status;
create policy "scan_status_select_own"
on public.scan_status
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "scan_status_insert_own_scan" on public.scan_status;
create policy "scan_status_insert_own_scan"
on public.scan_status
for insert
to authenticated
with check (
  auth.uid() = user_id
  and exists (
    select 1
    from public.scans s
    where s.id = scan_id
      and s.user_id = auth.uid()
  )
);

-- Usage counters policies
drop policy if exists "usage_counters_select_own" on public.usage_counters;
create policy "usage_counters_select_own"
on public.usage_counters
for select
to authenticated
using (auth.uid() = user_id);

-- No insert/update/delete policies for usage_counters.
-- Update this table only from trusted server code using the service role key,
-- or later create a SECURITY DEFINER RPC for safe increments.

-- =========================================================
-- 9. Grants
-- =========================================================

grant usage on schema public to anon, authenticated;

grant select, insert, update, delete on public.profiles to authenticated;
grant select, insert, update, delete on public.scans to authenticated;
grant select, insert, update, delete on public.scan_results to authenticated;
grant select, insert on public.scan_status to authenticated;
grant select on public.usage_counters to authenticated;

-- =========================================================
-- 10. Private Supabase Storage bucket for CV uploads
-- Path convention:
-- cv-uploads/{user_id}/{scan_id}/cv.pdf
-- =========================================================

insert into storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
values (
  'cv-uploads',
  'cv-uploads',
  false,
  5242880,
  array['application/pdf']
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- Storage policies
-- These policies assume the first folder in the object path is the user's auth.uid().
-- Example: {user_id}/{scan_id}/cv.pdf

drop policy if exists "cv_uploads_select_own_files" on storage.objects;
create policy "cv_uploads_select_own_files"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'cv-uploads'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "cv_uploads_insert_own_files" on storage.objects;
create policy "cv_uploads_insert_own_files"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'cv-uploads'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "cv_uploads_update_own_files" on storage.objects;
create policy "cv_uploads_update_own_files"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'cv-uploads'
  and (storage.foldername(name))[1] = auth.uid()::text
)
with check (
  bucket_id = 'cv-uploads'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "cv_uploads_delete_own_files" on storage.objects;
create policy "cv_uploads_delete_own_files"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'cv-uploads'
  and (storage.foldername(name))[1] = auth.uid()::text
);

-- =========================================================
-- Done
-- =========================================================
