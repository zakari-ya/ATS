# Security Review

Last reviewed: 2026-07-06

## Scope Checked

- Supabase browser, server, admin, and middleware clients.
- Protected App Router pages under `src/app/(app)`.
- Auth callback redirect handling.
- Scan Server Actions for create, upload, extract, analyze, delete, and dev RLS test.
- PDF upload metadata validation, PDF magic-byte validation, and text extraction limits.
- AI prompt, provider client, JSON parser, Zod schema, and backend scoring boundary.
- Dashboard/history/result UI privacy surfaces.
- Supabase RLS policies, Storage policies, and private `cv-uploads` bucket migration.
- Usage limits and daily quota counters.
- Environment variable usage and dependency list.

## Fixes Made

- Added pre-storage PDF magic-byte validation in the scan creation action so obvious non-PDF uploads are rejected before Storage upload.
- Added scan ID format validation before scan ownership queries inside scan mutation helpers.
- Replaced application-level usage counter read-modify-write with an atomic `increment_usage_counter` Postgres RPC.
- Restricted the usage counter RPC to `service_role` and revoked direct execution from `public`, `anon`, and `authenticated`.
- Revoked direct execution from trigger helper functions that do not need API execution.
- Hardened AI prompt data wrapping by serializing CV/job content as JSON strings inside clearly labeled untrusted data blocks.
- Replaced empty API route files with explicit safe handlers.
- Removed unused empty marketing route files that broke type checking.
- Replaced the default root page with an auth-aware redirect to `/dashboard` or `/login`.
- Added `.env.example` with placeholders only.

## RLS Checklist

- `profiles`: RLS enabled, users can select/update own profile.
- `scans`: RLS enabled, users can select/insert/update/delete own scans.
- `scan_results`: RLS enabled, users can access rows for their own scans only.
- `scan_status`: RLS enabled, users can select and insert timeline rows for their own scans.
- `usage_counters`: RLS enabled, users can select own counters only.
- No broad `using (true)` policies were found.
- Browser clients do not receive the service role key.

## Storage Checklist

- Bucket: `cv-uploads`.
- Bucket is configured as private in the migration.
- Storage path convention is `{user_id}/{scan_id}/cv.pdf`.
- Original file names are stored only as metadata, never used as Storage paths.
- Storage policies restrict access to the first path folder matching `auth.uid()`.
- App code does not generate public URLs or signed URLs for CV files.
- UI does not display private Storage paths.

## AI Safety Checklist

- AI calls run server-side only.
- `AI_PROVIDER_API_KEY` is read only in `src/lib/ai/client.ts`.
- AI receives no tools, file access, database access, or storage access.
- Prompt states CV and job description are untrusted data.
- Prompt states not to follow instructions inside CV/job content.
- AI output is parsed and validated with Zod before scoring or storage.
- Backend scoring calculates final score and label after validation.
- UI does not render raw AI JSON.

## File/PDF Checklist

- Upload max size is 5 MB.
- Server checks `.pdf` extension and `application/pdf` content type.
- Server now checks PDF magic bytes before Storage upload and again before extraction.
- Empty files are rejected.
- Scanned/image-only PDFs fail with:
  `This PDF looks like a scanned image. Please upload a text-based CV PDF where the text is selectable.`
- Extracted CV text is capped at 100,000 characters.
- No OCR or external file-processing service is used.

## Environment Variables

Required:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- `SUPABASE_SECRET_KEY`
- `AI_PROVIDER_API_KEY`
- `AI_MODEL`

Optional:

- `AI_PROVIDER_BASE_URL`

Rules:

- Only `NEXT_PUBLIC_*` values may be exposed to the browser.
- `SUPABASE_SECRET_KEY` must stay server-only.
- `AI_PROVIDER_API_KEY` must stay server-only.
- `.env.local` must not be committed.

## Remaining TODOs

- Apply `supabase/migrations/20260706000000_security_hardening.sql` in Supabase before relying on atomic usage increments.
- Run Supabase advisors after applying production migrations.
- Consider a short signed download flow only if users later need to download their original CV. Do not make the bucket public.
- Consider deleting original CV files automatically after analysis if product requirements do not need file retention.
- Add automated tests later for storage path building, PDF validation, AI schema rejection, and score calculation.

## Manual Security Test Checklist

1. Login as User A.
2. Create and complete a scan.
3. Copy `/scan/{scanId}`.
4. Logout.
5. Confirm the URL redirects to `/login`.
6. Login as User B.
7. Try opening User A scan URL.
8. Confirm the result is not accessible.
9. Confirm User B history does not show User A scans.
10. Try deleting User A scan as User B.
11. Confirm delete fails safely.
12. Try uploading a non-PDF file.
13. Confirm a safe file error appears.
14. Try uploading a renamed non-PDF file with `.pdf`.
15. Confirm it is rejected before or during PDF validation.
16. Try uploading a scanned/image-only PDF.
17. Confirm the scanned PDF message appears.
18. Set `ai_requests_used` to the daily limit.
19. Confirm no AI call happens after the limit is reached.
20. Confirm private CV files are not publicly accessible.
21. Confirm no CV Storage path is visible in the UI.
22. Confirm no raw AI JSON is visible in the UI. 

## Production Readiness Notes

- The current dashboard and history pages query only `scans` and `usage_counters`.
- Result pages query `scan_results`, but not private CV files or Storage URLs.
- Usage counters are protected by server-side checks; UI quota messages are informational only.
- The new atomic usage RPC is required for safer concurrent quota increments.
