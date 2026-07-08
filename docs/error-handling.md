# Error Handling

## Safe action result shape

Scan-related server actions use this shape:

```ts
type ActionResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: { code: AppErrorCode; message: string } }
```

This keeps expected failures predictable across:
- scan creation and upload
- PDF extraction
- AI analysis
- retry
- delete

## Safe error codes

Current safe error codes include:

- `UNAUTHORIZED`
- `SCAN_NOT_FOUND`
- `CV_FILE_NOT_FOUND`
- `RETRY_NOT_AVAILABLE`
- `INVALID_FILE_TYPE`
- `FILE_TOO_LARGE`
- `PDF_MAGIC_BYTES_INVALID`
- `PDF_TEXT_EXTRACTION_FAILED`
- `CV_TEXT_TOO_SHORT`
- `CV_TEXT_TOO_LONG`
- `JOB_DESCRIPTION_TOO_SHORT`
- `JOB_DESCRIPTION_TOO_LONG`
- `AI_PROVIDER_NOT_CONFIGURED`
- `AI_PROVIDER_AUTH_FAILED`
- `AI_MODEL_NOT_FOUND`
- `AI_REQUEST_FORMAT_INVALID`
- `AI_REQUEST_FAILED`
- `AI_JSON_INVALID`
- `AI_ANALYSIS_FAILED`
- `RATE_LIMITED`
- `DAILY_SCAN_LIMIT_REACHED`
- `DAILY_UPLOAD_LIMIT_REACHED`
- `DAILY_AI_LIMIT_REACHED`
- `USAGE_COUNTER_FAILED`
- `STORAGE_DOWNLOAD_FAILED`
- `STORAGE_UPLOAD_FAILED`
- `STORAGE_DELETE_FAILED`
- `DATABASE_WRITE_FAILED`
- `DATABASE_DELETE_FAILED`
- `DELETE_NOT_ALLOWED`
- `DELETE_FAILED`
- `SCORING_FAILED`
- `UNKNOWN_ERROR`

## User-facing messages

Examples:

- `UNAUTHORIZED` → `You need to sign in again.`
- `INVALID_FILE_TYPE` → `Please upload a PDF file.`
- `FILE_TOO_LARGE` → `Your PDF is too large. Please upload a file under 5 MB.`
- `CV_TEXT_TOO_SHORT` → `This PDF looks like a scanned image. Please upload a text-based CV PDF where the text is selectable.`
- `AI_JSON_INVALID` → `We could not validate the analysis safely. Please try again.`
- `DAILY_AI_LIMIT_REACHED` → `You reached your daily analysis limit. Please try again tomorrow.`
- `STORAGE_DELETE_FAILED` → `The scan was deleted, but the file cleanup needs to be retried.`
- `UNKNOWN_ERROR` → `Something went wrong. Please try again.`

## Retry behavior

Retry is available only for failed scans and still respects ownership and daily limits.

- If `cv_extracted_text` already exists, retry runs AI analysis only.
- If the uploaded PDF still exists but extracted text is missing, retry runs extraction and then AI analysis.
- If the stored PDF is missing, retry is blocked with a safe message.
- Retry does not re-upload files.
- Retry does not bypass daily AI limits.

## Route states

Added route-level states for:

- `src/app/(app)/dashboard/loading.tsx`
- `src/app/(app)/history/loading.tsx`
- `src/app/(app)/scan/[scanId]/loading.tsx`
- `src/app/(app)/scan/[scanId]/not-found.tsx`
- `src/app/(app)/scan/[scanId]/error.tsx`
- `src/app/(app)/error.tsx`

Expected failures should come through safe action results. Route `error.tsx` files are only for unexpected failures.

## What not to expose

Do not expose in UI or action responses:

- stack traces
- raw SQL or Supabase error details
- raw AI provider errors
- private storage paths
- full CV text
- full job description
- raw AI JSON
- user IDs

## Manual test checklist

1. Login and start a normal scan.
2. Confirm `/dashboard` and `/history` show loading skeletons during navigation.
3. Open a completed scan and confirm the result page loads normally.
4. Open a fake `/scan/{scanId}` URL and confirm the friendly not-found page.
5. Force a scanned image PDF and confirm the scanned PDF message appears.
6. Force an invalid AI key and confirm only a safe failure message appears.
7. Force a failed scan with extracted text present and confirm retry runs analysis only.
8. Force a failed scan with uploaded PDF but no extracted text and confirm retry runs extraction then analysis.
9. Force daily AI limit reached and confirm retry is blocked safely.
10. Confirm no raw provider, SQL, or storage path details appear in UI.
