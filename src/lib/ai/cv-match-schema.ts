import { z } from "zod";

export const AI_REQUIREMENT_PRIORITIES = [
  "critical",
  "required",
  "preferred",
] as const;

export const AI_MATCH_STATUSES = [
  "exact_match",
  "semantic_match",
  "partial_match",
  "unclear",
  "missing",
] as const;

export const AI_MATCH_STRENGTH_BY_STATUS = {
  exact_match: 1,
  semantic_match: 0.85,
  partial_match: 0.5,
  unclear: 0.25,
  missing: 0,
} as const satisfies Record<(typeof AI_MATCH_STATUSES)[number], number>;

const HIRING_DECISION_LANGUAGE_PATTERNS = [
  /\baccepted\b/i,
  /\brejected\b/i,
  /\bguaranteed\s+to\s+pass\b/i,
  /\bguaranteed\s+to\s+fail\b/i,
];

const MAX_SHORT_TEXT_LENGTH = 160;
const MAX_EVIDENCE_LENGTH = 280;
const MAX_REASON_LENGTH = 360;
const MAX_FEEDBACK_LENGTH = 260;

const shortTextSchema = z.string().trim().min(1).max(MAX_SHORT_TEXT_LENGTH);
const optionalShortTextSchema = z.string().trim().max(MAX_SHORT_TEXT_LENGTH);
const evidenceSchema = z.string().trim().min(1).max(MAX_EVIDENCE_LENGTH);
const nullableEvidenceSchema = z
  .union([z.string().trim().max(MAX_EVIDENCE_LENGTH), z.null()])
  .transform((value) => (value === "" ? null : value));

function hasHiringDecisionLanguage(value: string): boolean {
  return HIRING_DECISION_LANGUAGE_PATTERNS.some((pattern) =>
    pattern.test(value)
  );
}

const safeFeedbackTextSchema = z
  .string()
  .trim()
  .min(1)
  .max(MAX_FEEDBACK_LENGTH)
  .refine((value) => !hasHiringDecisionLanguage(value), {
    message: "Feedback contains restricted hiring-decision language.",
  })
  .refine((value) => !/<[^>]+>/.test(value), {
    message: "Feedback must not contain raw HTML.",
  });

export const aiRequirementPrioritySchema = z.enum(AI_REQUIREMENT_PRIORITIES);
export const aiMatchStatusSchema = z.enum(AI_MATCH_STATUSES);

export const aiInputQualitySchema = z
  .object({
    cv_text_quality: z.enum(["good", "medium", "poor"]),
    job_description_quality: z.enum(["good", "medium", "poor"]),
    analysis_reliability: z.enum(["high", "medium", "low"]),
    warnings: z.array(z.string().trim().min(1).max(180)).max(8),
  })
  .strict();

const aiJobSkillSchema = z
  .object({
    name: shortTextSchema,
    category: shortTextSchema,
    priority: aiRequirementPrioritySchema,
    evidence: evidenceSchema,
  })
  .strict();

export const aiJobProfileSchema = z
  .object({
    role_title: shortTextSchema,
    seniority: optionalShortTextSchema,
    required_skills: z.array(aiJobSkillSchema).max(30),
    preferred_skills: z.array(aiJobSkillSchema).max(30),
    responsibilities: z.array(evidenceSchema).max(30),
    experience_requirements: z
      .object({
        minimum_years: z.number().int().min(0).max(60).nullable(),
        level: optionalShortTextSchema,
        evidence: evidenceSchema,
      })
      .strict(),
  })
  .strict();

const aiCvSkillSchema = z
  .object({
    name: shortTextSchema,
    category: shortTextSchema,
    evidence: evidenceSchema,
  })
  .strict();

const aiCvProjectSchema = z
  .object({
    name: shortTextSchema,
    relevant_skills: z.array(shortTextSchema).max(20),
    evidence: evidenceSchema,
  })
  .strict();

export const aiCvProfileSchema = z
  .object({
    detected_role: optionalShortTextSchema,
    skills: z.array(aiCvSkillSchema).max(50),
    projects: z.array(aiCvProjectSchema).max(20),
    experience_summary: z
      .object({
        estimated_level: optionalShortTextSchema,
        evidence: evidenceSchema,
      })
      .strict(),
  })
  .strict();

export const aiMatchMatrixItemSchema = z
  .object({
    requirement: shortTextSchema,
    priority: aiRequirementPrioritySchema,
    category: shortTextSchema,
    match_status: aiMatchStatusSchema,
    match_strength: z.number(),
    confidence: z.number().min(0).max(1),
    job_evidence: evidenceSchema,
    cv_evidence: nullableEvidenceSchema,
    reason: z.string().trim().min(1).max(MAX_REASON_LENGTH),
  })
  .strict()
  .superRefine((item, context) => {
    const expectedStrength = AI_MATCH_STRENGTH_BY_STATUS[item.match_status];

    if (item.match_strength !== expectedStrength) {
      context.addIssue({
        code: "custom",
        path: ["match_strength"],
        message: `match_strength must be ${expectedStrength} for ${item.match_status}.`,
      });
    }

    const hasCvEvidence =
      typeof item.cv_evidence === "string" && item.cv_evidence.trim().length > 0;

    if (
      ["exact_match", "semantic_match", "partial_match"].includes(
        item.match_status
      ) &&
      !hasCvEvidence
    ) {
      context.addIssue({
        code: "custom",
        path: ["cv_evidence"],
        message: "Matched requirements must include CV evidence.",
      });
    }

    if (item.match_status === "missing" && hasCvEvidence) {
      context.addIssue({
        code: "custom",
        path: ["cv_evidence"],
        message: "Missing requirements must not include CV evidence.",
      });
    }
  });

export const aiFeedbackInputsSchema = z
  .object({
    strong_points: z.array(safeFeedbackTextSchema).max(12),
    missing_required_items: z.array(safeFeedbackTextSchema).max(20),
    missing_preferred_items: z.array(safeFeedbackTextSchema).max(20),
    weak_points: z.array(safeFeedbackTextSchema).max(12),
    recommended_cv_improvements: z.array(safeFeedbackTextSchema).max(12),
  })
  .strict();

export const aiCvMatchResponseSchema = z
  .object({
    input_quality: aiInputQualitySchema,
    job_profile: aiJobProfileSchema,
    cv_profile: aiCvProfileSchema,
    match_matrix: z.array(aiMatchMatrixItemSchema).min(1).max(80),
    feedback_inputs: aiFeedbackInputsSchema,
  })
  .strict()
  .superRefine((response, context) => {
    if (
      response.input_quality.job_description_quality === "good" &&
      response.job_profile.required_skills.length === 0
    ) {
      context.addIssue({
        code: "custom",
        path: ["job_profile", "required_skills"],
        message:
          "required_skills cannot be empty when job_description_quality is good.",
      });
    }
  });
