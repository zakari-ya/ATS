# UX Principles

## Product Feeling

The product should feel like a serious premium SaaS.

Keywords:
- premium
- calm
- clean
- luxury
- trustworthy
- focused
- mobile-first
- professional
- not generic
- not AI-looking

Avoid:
- boring default dashboard
- cheap gradients
- too many colors
- noisy cards
- heavy animations
- confusing forms
- cluttered result page
- long generic AI text

## Main User Flow

```txt
1. Sign in
2. Upload CV
3. Paste job description
4. Start analysis
5. See progress
6. View result
7. Improve CV
```

This flow must feel simple.

The user should always know:
- what to do next
- what is happening now
- what went wrong if there is an error
- what the final result means

## Mobile-First Rule

Design mobile first.

Every screen must work beautifully on mobile:
- landing
- login
- upload
- scan progress
- result
- history
- settings

Desktop can add more layout space, but mobile is the base.

## Visual Direction

Use:
- strong whitespace
- large rounded cards
- refined borders
- soft shadows
- subtle gradients
- elegant typography
- clear hierarchy
- calm colors
- strong contrast
- premium empty states
- high-quality loading states

Do not overuse:
- animations
- gradients
- icons
- badges
- borders
- glass effects

## Scan Page UX

The scan page should have two main inputs:

1. CV upload card
2. Job description textarea

The page should clearly explain:
- PDF only
- max size 5 MB
- CV is private
- analysis is ATS-style, not a hiring decision

Good microcopy:

```txt
Upload your CV and paste the job post. We will compare both and show what matches, what is missing, and what to improve before applying.
```

## Upload UX

Upload card should show:
- animated upload icon
- allowed file type
- max size
- selected file name
- validation status
- clear remove/change action

Error examples:
- "Please upload a PDF file."
- "This file is too large. Maximum size is 5 MB."
- "We could not read this PDF. Try a clean text-based version."

## Progress UX

Show progress steps:
- Validating file
- Reading CV
- Analyzing job match
- Calculating score
- Preparing feedback

Use subtle animation.

Do not fake exact percentages unless real.

Better:
- step-based progress
- clear messages
- animated scan icon

## Result Page UX

Show result in this order:

1. Score card
2. Short summary
3. Matched required skills
4. Missing required skills
5. Missing preferred skills
6. Score breakdown
7. Practical improvements
8. Reliability/disclaimer

The first view should answer:

```txt
How good is my CV for this job?
What is missing?
What should I fix first?
```

## Score Card

Score card should include:
- numeric score
- label
- one-sentence explanation
- analysis reliability
- short disclaimer

Example:

```txt
Good match · 76%
Your CV matches the main frontend/backend requirements, but PostgreSQL and Docker are not clearly visible.
```

## Feedback Tone

Use clear, practical language.

Good:
- "PostgreSQL is required in the job post, but it is not visible in your CV."
- "Your Express.js project supports the Node.js backend requirement."
- "Add a truthful bullet about SQL/database work if you have used it."

Bad:
- "Your CV is bad."
- "You are rejected."
- "You will get the job."
- "Just add Docker."
- "Optimize your resume to beat the ATS."

## Animated Icons

Use lucide-animated for important product moments:
- upload CV
- secure scan
- analyzing
- success
- warning
- score result

Do not animate everything.

Animations should be:
- subtle
- fast
- useful
- premium

## Accessibility

Rules:
- all inputs have labels
- buttons are keyboard accessible
- focus states visible
- errors are near the field
- loading state has text
- color is not the only signal
- text contrast is readable
- font sizes are comfortable on mobile

## Components

Recommended reusable UI:
- AppShell
- Navbar
- MobileBottomNav
- UploadCard
- JobDescriptionForm
- ScanProgress
- ScoreCard
- SkillBadge
- FeedbackSection
- EmptyState
- ErrorState
- LoadingState

## shadcn/ui Usage

Use shadcn/ui as a base, then customize.

Do not leave the app looking like a default template.

The components should feel branded and polished.

## References

- shadcn/ui Introduction: https://ui.shadcn.com/docs
- shadcn/ui Installation: https://ui.shadcn.com/docs/installation
- Next.js Project Structure: https://nextjs.org/docs/app/getting-started/project-structure
