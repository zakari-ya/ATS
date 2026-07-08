# Vercel Deploy

## Before you deploy

1. Add the required environment variables in Vercel Project Settings.
2. Configure them separately for:
   - Preview
   - Production
3. Redeploy after any environment variable change.
4. Make sure the production domain is added to Supabase Auth redirect URLs.

## Required Vercel environment variables

Add these in Vercel:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- `NEXT_PUBLIC_APP_URL`
- `SUPABASE_SECRET_KEY`
- `AI_PROVIDER`
- `AI_PROVIDER_API_KEY`
- `AI_PROVIDER_BASE_URL`
- `AI_MODEL`
- `MAX_SCANS_PER_DAY`
- `MAX_FILE_UPLOADS_PER_DAY`
- `MAX_AI_REQUESTS_PER_DAY`
- `MAX_CV_FILE_SIZE_MB`
- `NEXT_PUBLIC_MAX_CV_FILE_SIZE_MB`

## Vercel project setup

1. Connect the Git repository to Vercel.
2. Keep the default Next.js framework preset.
3. Use the standard build command:

```bash
npm run build
```

4. Use the standard start command:

```bash
npm run start
```

5. Prefer Node.js 22 in production.

## Deployment notes

- Never commit `.env.local`.
- Do not put AI keys in `NEXT_PUBLIC_*`.
- Do not put `SUPABASE_SECRET_KEY` in `NEXT_PUBLIC_*`.
- If you change OAuth domains or callback URLs, redeploy and test login again.

## After deploy

Test these flows on the deployed domain:

1. Google login
2. CV upload to the private bucket
3. PDF extraction
4. AI analysis
5. Result page load
6. History page load
7. Scan deletion and storage cleanup
