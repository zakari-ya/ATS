# Architecture

## Product Goal

Build an ATS-style CV checker SaaS.

The app lets a user:
1. Sign in.
2. Upload a CV PDF.
3. Paste a job description.
4. Get an ATS-style match score.
5. See clear feedback about matched skills, missing required skills, missing preferred skills, weak points, and improvements.

The product is not a hiring decision system. It is a CV readiness and job match checker.

Use these labels only:
- Great match
- Good match
- Needs improvement
- Low match

Do not use:
- Accepted
- Rejected
- Guaranteed to pass
- Guaranteed to fail

## Stack

Frontend:
- Next.js App Router
- TypeScript
- Tailwind CSS
- shadcn/ui
- lucide-animated for key animated icons
- Motion for subtle premium animation

Backend:
- Next.js Route Handlers / Server Actions
- Supabase Auth
- Supabase Postgres
- Supabase Storage
- Row Level Security
- Zod validation
- AI API with structured JSON output

Core logic:
- PDF validation
- PDF text extraction
- AI JSON analysis
- AI JSON validation
- Backend scoring
- Secure result storage

## Main Flow

```txt
User signs in
↓
User creates scan
↓
App creates row in scans
↓
User uploads CV PDF to private Supabase Storage
↓
Server validates file metadata and extracted content
↓
Server extracts CV text
↓
User submits job description
↓
Server validates and sanitizes job description
↓
Server sends CV text + job description to AI
↓
AI returns strict JSON
↓
Server validates AI JSON with Zod
↓
Server calculates score
↓
Server saves result to scan_results
↓
Server updates scans summary
↓
User sees final result
```

## Folder Structure

```txt
src/
  app/
    (marketing)/
    (app)/
      dashboard/
      scan/
      history/
      settings/
    auth/
    api/
  components/
    ui/
    layout/
    shared/
  features/
    scan/
    feedback/
    auth/
    billing/
  lib/
    supabase/
    security/
    scoring/
    ai/
    pdf/
  styles/
  types/

supabase/
  migrations/
  seed.sql

docs/
  architecture.md
  security.md
  database.md
  scoring-system.md
  ai-json-contract.md
  ux-principles.md

tests/
```

## Responsibility Split

### UI

UI handles:
- displaying forms
- mobile-first layout
- loading states
- progress states
- result cards
- user-friendly errors

UI does not handle:
- security validation
- AI calls
- scoring
- file trust decisions
- private server secrets

### Server

Server handles:
- auth checks
- RLS-safe data access
- file validation
- PDF text extraction
- job description validation
- AI calls
- AI JSON validation
- scoring
- writing final results

### AI

AI handles:
- understanding job description
- understanding CV text
- extracting job requirements
- extracting CV evidence
- comparing requirement by requirement
- returning strict JSON

AI does not:
- decide the final score
- decide final label
- write to database
- upload/delete files
- receive tools
- receive secrets

### Code

Code handles:
- validating AI JSON
- normalizing output
- calculating final score
- applying caps and penalties
- saving safe results
- protecting private data

## Data Model Summary

Use these tables:

```txt
profiles
scans
scan_results
scan_status
usage_counters
```

Key rule:

```txt
scans = small dashboard summary
scan_results = heavy detailed result
scan_status = progress timeline
usage_counters = limits and abuse protection
```

## Performance Rules

Dashboard and history pages must query `scans`, not `scan_results`.

The result page may query:
- `scans`
- `scan_results`
- `scan_status`

Never load raw AI JSON or full CV text on pages that do not need it.

## References

- Next.js Project Structure: https://nextjs.org/docs/app/getting-started/project-structure
- Supabase SSR Auth: https://supabase.com/docs/guides/auth/server-side
- Supabase RLS: https://supabase.com/docs/guides/database/postgres/row-level-security
