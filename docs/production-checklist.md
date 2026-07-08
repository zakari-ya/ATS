# Production Checklist

## Before deploy

Run:

```bash
npm run lint
npm run typecheck
npm run test:run
npm run build
```

Confirm:

- `.env.local` is ignored
- `.env.example` contains no real secrets
- no AI key is committed
- no Supabase secret key is committed
- Supabase RLS is enabled
- `cv-uploads` is private
- usage limits are enabled

## Vercel setup

1. Connect the repository.
2. Add all environment variables in Project Settings.
3. Set the production domain.
4. Redeploy after any env change.

## Supabase setup

1. Run SQL migrations.
2. Verify RLS policies.
3. Verify the private storage bucket.
4. Verify Google OAuth production redirect URLs.
5. Verify the usage counter RPC exists.

## Smoke test after deploy

1. Open the production URL.
2. Login with Google.
3. Create a scan with test data.
4. Upload a text-based PDF.
5. Run AI analysis.
6. Open the result page.
7. Open the history page.
8. Delete the scan.
9. Confirm the storage file is removed.
10. Confirm usage limit messages still appear safely when limits are reached.

## Logging and privacy checks

- No full CV text is logged.
- No full job description is logged.
- No raw AI JSON is logged.
- No secrets are logged.
- No storage paths are shown in normal UI.

## Resource protection checks

- PDF upload limit stays at 5 MB.
- Job description max length stays at 20,000 characters.
- Extracted CV text max length stays enforced.
- Daily scan limit stays enforced server-side.
- Daily upload limit stays enforced server-side.
- Daily AI limit stays enforced server-side.
