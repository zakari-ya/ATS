# Supabase Production Checklist

## Auth

- Google OAuth is enabled.
- Supabase Auth Site URL uses the production app domain.
- Redirect URLs include:
  - production domain
  - preview domain if needed
  - localhost only for local development
- Login is tested from the deployed app.

## Database

- RLS is enabled on `profiles`.
- RLS is enabled on `scans`.
- RLS is enabled on `scan_results`.
- RLS is enabled on `scan_status`.
- RLS is enabled on `usage_counters`.
- No broad `using (true)` policies exist for private user data.
- User-owned `select` policies exist where required.
- User-owned `insert` policies exist where required.
- User-owned `update` policies exist where required.
- User-owned `delete` policies exist where required.

## Storage

- Bucket `cv-uploads` exists.
- Bucket `cv-uploads` is private.
- Storage policies restrict access to the authenticated user folder only.
- No public URLs are generated for CV files.
- No public bucket is used for CV uploads.
- Upload path format remains:

```txt
{user_id}/{scan_id}/cv.pdf
```

## Secrets

- `SUPABASE_SECRET_KEY` is only used in server code.
- `SUPABASE_SECRET_KEY` is not present in client bundles.
- `AI_PROVIDER_API_KEY` is only used in server code.
- `AI_PROVIDER_API_KEY` is not present in client bundles.

## Migrations

- All SQL migrations are applied in production.
- `supabase/migrations/20260706000000_security_hardening.sql` is applied.
- The `increment_usage_counter` RPC exists in production.
- Storage policies for `cv-uploads` are active.

## Final checks

1. Login works.
2. Upload works.
3. RLS blocks cross-user access.
4. Private files are not publicly accessible.
5. Usage limits still block expensive operations server-side.
