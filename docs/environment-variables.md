# Environment Variables

## Public variables

These values are safe to expose to the browser and must use `NEXT_PUBLIC_`.

### `NEXT_PUBLIC_SUPABASE_URL`

- Required
- Supabase project URL
- Used by browser auth and SSR helpers

### `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`

- Required
- Supabase publishable key
- Safe for browser use

### `NEXT_PUBLIC_APP_URL`

- Recommended for deployment documentation and external config consistency
- Example: `https://your-app.vercel.app`
- Do not hardcode localhost in production code

### `NEXT_PUBLIC_MAX_CV_FILE_SIZE_MB`

- Optional UI-facing value
- Keep aligned with the real server-side limit
- Current MVP limit: `5`

## Private server-only variables

These must never use `NEXT_PUBLIC_`.

### `SUPABASE_SECRET_KEY`

- Required for trusted server-only operations
- Never import this into client code
- Never commit this value

### `AI_PROVIDER`

- Optional provider label
- Recommended examples:
  - `openrouter`
  - `gemini`
  - `openai-compatible`
- Used for deployment clarity and future routing, not for browser logic

### `AI_PROVIDER_API_KEY`

- Required when AI analysis is enabled
- Server-only
- Never expose in browser bundles

### `AI_PROVIDER_BASE_URL`

- Optional
- Required when using a non-default OpenAI-compatible endpoint
- Example OpenRouter: `https://openrouter.ai/api/v1`
- Example Gemini OpenAI-compatible endpoint: `https://generativelanguage.googleapis.com/v1beta/openai`

### `AI_MODEL`

- Required when AI analysis is enabled
- Example: provider-specific model name

## Resource protection variables

### `MAX_SCANS_PER_DAY`

- Optional
- Current default: `5`

### `MAX_FILE_UPLOADS_PER_DAY`

- Optional
- Current default: `10`

### `MAX_AI_REQUESTS_PER_DAY`

- Optional
- Current default: `5`

### `MAX_CV_FILE_SIZE_MB`

- Deployment documentation variable for the intended file-size limit
- Keep it aligned with the current hardcoded server-side validation limit
- Current MVP limit: `5`

## Rules

- Never commit real secrets.
- Never expose `SUPABASE_SECRET_KEY` in client code.
- Never expose `AI_PROVIDER_API_KEY` in client code.
- Public variables are only the ones prefixed with `NEXT_PUBLIC_`.
- Keep `.env.local` out of version control.
