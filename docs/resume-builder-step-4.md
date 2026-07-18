# Resume Builder Step 4

Step 4 connects the existing trusted profile, grounded draft, and fixed PDF
template into the protected tailored-resume workflow at
`/scan/[scanId]/resume`.

## Flow

1. A completed, owned scan exposes the tailored-resume action.
2. If no profile exists, server-side fact extraction creates candidate-only
   values from the stored CV text.
3. The user confirms, corrects, removes, or adds factual information. Edits
   are stored as `user_provided` values with `user_input` provenance.
4. Missing scan skills can only be added after the user provides real evidence.
5. The server reruns readiness checks before invoking the grounded Step 3
   generator.
6. A valid draft can be edited, saved, previewed with the fixed PDF template,
   regenerated, and downloaded.

## Trust and safety

Candidate facts never become trusted automatically. The client only submits a
fact ID and requested action; server actions authenticate the current user,
verify completed-scan ownership through the existing repositories, validate
all payloads, and persist normalized schemas. The final PDF receives only a
`ResumeReadyProfile` and a validated grounded draft.

The generation service keeps its existing ownership checks, usage limit, and
grounding validation. Editing wording is saved through the same draft
repository, which rejects unknown fact references and unsupported numerical
claims.

## Scope

This step adds no new tables, no landing-page changes, no scoring changes, and
no change to the original CV/job analysis pipeline.

## Resume language

CVMatch supports English and French resume output. When CV information is prepared, the server deterministically suggests a language from the extracted CV text. The user can choose English or French before generation, and the choice is persisted separately from factual profile data.

The selected language is supplied to the grounded tailoring prompt for rewritten summary and bullet text, then stored with the draft. The fixed PDF template localizes its headings and static labels from that stored choice. Changing the language after a draft exists requires confirmation and clears that draft so mixed-language output is not shown.
