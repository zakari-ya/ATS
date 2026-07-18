# Resume Builder Step 3

Step 3 adds the server-only tailored-resume draft pipeline. It does not add a
button, editor, preview integration, download flow, or any other product UI.

## Trusted input

Generation requires an authenticated owner, a completed scan with a validated
AI analysis, and a Step 1 resume profile that is ready for use. The provider
receives only confirmed or user-provided facts. Contact details, social links,
storage paths, private file URLs, raw provider output, and scoring internals
are excluded.

The job description and scan analysis are context only. The score is not
recalculated or changed. AI may later rewrite or prioritize trusted facts, but
it may not create new facts.

## Draft contract and grounding

`resume_drafts.draft_data` contains schema version 1 selection IDs, section
ordering, concise rewritten summary sentences and bullets, source fact IDs,
and warnings. It does not contain factual identity/contact values, skill names,
company names, links, dates, or profile entry names.

Every generated sentence is checked against its cited trusted fact IDs. The
validator rejects unknown, candidate, cross-profile, cross-entry, duplicate,
unsupported, contact, URL, and unsupported numerical claims. Numbers must be
present in a cited fact. Invalid drafts are never stored.

## Prompt safety

The prompt explicitly treats the CV facts, job description, and scan analysis
as untrusted data. It prohibits following embedded instructions, tools, web
search, file access, code execution, external retrieval, scoring changes, and
new factual claims. The response is requested as JSON, parsed as unknown,
validated with Zod, then deterministically grounded.

## Persistence and RLS

Apply `20260715000000_resume_drafts.sql` after the Step 1 migration. The table
has one active draft per user and completed source scan. RLS select, insert,
update, and delete policies require the authenticated user to own the draft,
source scan, and linked resume profile. Server repositories repeat these
ownership checks and validate JSONB on read and write.

## Usage and concurrency

`resume_generation` is a named provider action that uses the existing
server-side `ai_requests_used` counter. It is checked and consumed only after
local validation and immediately before an actual provider request. It does
not consume quota for reads, downloads, or pre-provider validation failures.
A process-local in-flight guard rejects duplicate parallel generation requests
for the same user and scan. For multi-instance queue processing, replace this
guard with a durable database or queue lock before scaling.

## Not included

No UI, editor, PDF integration, navigation, scan-result changes, score changes,
new scan analysis, or user-confirmation workflow is added in this step.
