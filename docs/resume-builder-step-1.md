# Resume Builder Step 1

Step 1 creates the private, validated resume-data foundation only. It does not
add an editor, preview, PDF export, AI resume generation, navigation, or UI.

## Profile structure

`resume_profiles.profile_data` stores schema version `1` and a structured
resume profile linked to exactly one completed `scans` row. It includes basics,
an original summary, skills, experience, projects, education, certifications,
and languages. Dates remain display text such as `2026` or `Present`.

Each factual value has a stable UUID, a verification status, and provenance.
Section entries, skills, and bullets also use stable UUIDs.

## Verification and provenance

- `candidate`: extracted from CV text and not yet reviewed.
- `cv_verified`: extracted value and provenance matched exactly against the
  uploaded CV text; it is ready to use without separate confirmation.
- `confirmed`: extracted from CV text and approved by the user.
- `user_provided`: directly added or corrected by the user.

Candidate, CV-verified, and confirmed CV-derived values require a `cv_text`
source. User-provided values require a `user_input` source. `cv_verified`,
`confirmed`, and `user_provided` values are trusted for future resume generation.

AI may later rewrite or prioritize trusted facts, but it may not create new
facts.

## Ownership and RLS

`resume_profiles` is private. Every row belongs to one authenticated user and
one completed scan owned by that same user. RLS restricts select, insert,
update, and delete operations to `auth.uid() = user_id`; insert and update also
verify that `source_scan_id` is owned by the user and has completed.

The server-only repository repeats these checks before every read, upsert, and
delete. It validates incoming JSONB and stored JSONB with Zod.

## Applying the migration

Apply `20260711000000_resume_profiles.sql` before using the repository. In
Supabase projects that restrict Data API exposure for newly created tables,
expose `resume_profiles` to the Data API after applying the migration. RLS
remains enabled and is still the authorization boundary.

## Trust and readiness

A profile is ready only when the full name and at least one contact method are
trusted and at least one meaningful content section contains trusted facts.
Legacy candidate facts with valid CV provenance are normalized to
`cv_verified`; future ungrounded candidates still require review.

## Not included

Step 1 does not extract resume facts from PDFs, call AI, create or edit a
resume, render a preview, generate a PDF, or add any user interface.
