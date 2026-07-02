# Scoring System

## Goal

The score must feel correct, stable, and explainable.

Do not use simple keyword math only.

Bad scoring:

```txt
matched skills / total skills = score
```

Good scoring:

```txt
weighted requirements
+ match strength
+ evidence quality
+ confidence
+ critical missing caps
+ backend-controlled final label
```

AI helps understand the CV and job description. Code calculates the final score.

## Final Labels

Use only:

```txt
85-100 = Great match
70-84 = Good match
50-69 = Needs improvement
0-49 = Low match
```

These ranges are not enough alone.

Always apply score caps and penalties.

## Match Status

Allowed match statuses:

```txt
exact_match
semantic_match
partial_match
unclear
missing
```

Meaning:

- exact_match: CV clearly mentions the same requirement.
- semantic_match: CV has equivalent or strongly related evidence.
- partial_match: CV has weak or incomplete evidence.
- unclear: possible match but not enough proof.
- missing: no CV evidence.

## Match Strength

Use fixed numeric values:

```txt
exact_match = 1.0
semantic_match = 0.85
partial_match = 0.5
unclear = 0.25
missing = 0
```

AI may return match status and match strength, but code must validate the value.

## Requirement Priority

Allowed priorities:

```txt
critical
required
preferred
```

Suggested weights:

```txt
critical = 5
required = 4
preferred = 2
```

Critical examples:
- must-have license/certification
- required language
- required technology for the role
- required years of experience if strongly stated

Preferred examples:
- nice-to-have tools
- bonus frameworks
- extra certifications

## Scoring Categories

Recommended final score composition:

```txt
Required/Critical requirements: 50%
Experience relevance: 20%
Project/work evidence: 15%
Preferred skills: 10%
CV clarity / ATS readability: 5%
```

Alternative for more candidate-friendly scoring:

```txt
Required/Critical requirements: 45%
Experience relevance: 20%
Project/work evidence: 15%
Preferred skills: 10%
CV clarity / ATS readability: 10%
```

Use one version and store it as `score_version`.

## Requirement Match Calculation

For each requirement:

```txt
requirement_points = priority_weight * match_strength * confidence_adjustment
```

Confidence adjustment:

```txt
confidence >= 0.85 = 1.0
confidence >= 0.65 = 0.9
confidence >= 0.45 = 0.75
confidence < 0.45 = 0.5
```

Then:

```txt
category_score = sum(requirement_points) / sum(max_requirement_points) * 100
```

## Score Caps

Caps make the score realistic.

Apply these after the weighted score.

Examples:

```txt
If one critical requirement is missing:
max score = 79

If two or more critical requirements are missing:
max score = 59

If one required requirement is missing:
max score = 84

If two or more required requirements are missing:
max score = 69

If most required requirements are missing:
max score = 49

If CV text extraction quality is poor:
max score = 60

If job description is too vague:
result reliability = low
max score = 75

If AI JSON validation fails:
no normal score
```

## Label Caps

Great Match is impossible if:
- any critical requirement is missing
- AI validation status is invalid
- CV extraction quality is poor
- job description is unreliable

Good Match is usually impossible if:
- multiple required skills are missing
- work/project evidence is weak
- most matches are only unclear or partial

## Score Breakdown Output

Store this in `score_breakdown`:

```json
{
  "requiredRequirementsScore": 78,
  "experienceRelevanceScore": 70,
  "projectEvidenceScore": 82,
  "preferredSkillsScore": 35,
  "cvClarityScore": 90,
  "baseWeightedScore": 73.6,
  "finalScore": 69,
  "appliedCaps": [
    {
      "code": "MULTIPLE_REQUIRED_SKILLS_MISSING",
      "reason": "Two required skills are missing, so Good Match is capped."
    }
  ]
}
```

## Correct Feedback Logic

Feedback must explain the score.

Show:
- matched critical/required skills
- missing required skills
- missing preferred skills
- weak evidence areas
- practical improvements

Avoid:
- generic advice
- fake certainty
- telling user to invent experience
- hiring decision language

Good feedback example:

```txt
Your CV shows strong React and Node.js experience, but this job asks for PostgreSQL and Docker. PostgreSQL is required and not visible in the CV, so the match cannot be rated as Great Match. Add a truthful bullet about SQL/PostgreSQL work if you have used it.
```

## Reliability

Store and display analysis reliability when useful:

```txt
high
medium
low
```

Low reliability cases:
- CV text extraction failed partially
- job description is too short/vague
- AI JSON required retry
- too many unclear matches
- PDF appears scanned or unreadable

## References

- OpenAI Structured Outputs: https://developers.openai.com/api/docs/guides/structured-outputs
- OWASP LLM Prompt Injection Prevention: https://cheatsheetseries.owasp.org/cheatsheets/LLM_Prompt_Injection_Prevention_Cheat_Sheet.html
