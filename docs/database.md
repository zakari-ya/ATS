# Database

## Database Choice

Use Supabase Postgres.

Main reasons:
- relational data
- built-in Auth
- private Storage
- Row Level Security
- clear SQL migrations
- better fit for private CV data

## Tables

Use five tables:

```txt
profiles
scans
scan_results
scan_status
usage_counters
```

## Table: profiles

Purpose:
- user profile linked to Supabase Auth

Fields:
- id
- email
- full_name
- avatar_url
- created_at
- updated_at

Rules:
- `id` references `auth.users(id)`
- user can read/update only own profile
- profile is created automatically when a user signs up

## Table: scans

Purpose:
- small scan summary for dashboard and history

Fields:
- id
- user_id
- job_title
- cv_storage_path
- cv_file_name
- cv_file_size
- cv_content_type
- current_status
- final_score
- final_label
- created_at
- updated_at
- completed_at
- deleted_at

Do store:
- ownership
- file reference
- current status
- final score summary
- final label summary
- dates

Do not store:
- full job description
- extracted CV text
- AI JSON
- long recommendations
- full scoring breakdown

Indexes:
- user_id + created_at desc
- user_id + current_status
- user_id + deleted_at

## Table: scan_results

Purpose:
- heavy result details for one scan

Fields:
- id
- scan_id
- user_id
- job_description
- cv_extracted_text
- cv_text_char_count
- ai_json
- ai_schema_version
- ai_validation_status
- final_score
- final_label
- score_breakdown
- matched_skills
- missing_required_skills
- missing_preferred_skills
- strong_points
- weak_points
- recommendations
- applied_caps
- prompt_version
- score_version
- error_code
- error_message
- created_at
- updated_at

Rules:
- one result per scan
- result belongs to same user as scan
- load only on result page
- never load this table for dashboard cards

Indexes:
- scan_id
- user_id + created_at desc

## Table: scan_status

Purpose:
- timeline/progress/debug events

Fields:
- id
- scan_id
- user_id
- status
- message
- safe_metadata
- created_at

Examples:
- created
- uploaded
- validating_file
- extracting_text
- analyzing
- scoring
- completed
- failed

Rules:
- `scans.current_status` stores latest status
- `scan_status` stores history
- safe_metadata must not contain full CV text or full job description

Indexes:
- scan_id + created_at asc
- user_id + created_at desc

## Table: usage_counters

Purpose:
- free plan limits and abuse protection

Fields:
- id
- user_id
- period_key
- scans_used
- files_uploaded
- ai_requests_used
- updated_at

Rules:
- users can read own counters
- only trusted server code should increment counters
- period_key can be daily, for example `2026-07-02`

## Storage

Bucket:

```txt
cv-uploads
```

Bucket type:
- private

Path convention:

```txt
{user_id}/{scan_id}/cv.pdf
```

Policy:
- authenticated users can access only files where first path folder is their auth user id

## Why We Split Tables

Do not put everything in `scans`.

Reason:
- dashboard should be fast
- scan result can be large
- AI JSON can be large
- CV text is sensitive
- status timeline should be separate
- debugging should be easy

Best pattern:

```txt
scans = small and fast
scan_results = heavy and detailed
scan_status = progress timeline
```

## RLS Policy Principle

Every table must use RLS.

For user-owned tables:

```sql
auth.uid() = user_id
```

For profile:

```sql
auth.uid() = id
```

For storage:

```sql
(storage.foldername(name))[1] = auth.uid()::text
```

## References

- Supabase RLS: https://supabase.com/docs/guides/database/postgres/row-level-security
- Supabase Storage Access Control: https://supabase.com/docs/guides/storage/security/access-control
- Supabase Storage Uploads: https://supabase.com/docs/guides/storage/uploads
