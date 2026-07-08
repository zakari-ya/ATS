import type { AiInputQuality, AiRequirementPriority } from "@/types/ai";

export const SCORING_VERSION = "v1";

export const PRIORITY_WEIGHTS = {
  critical: 5,
  required: 4,
  preferred: 2,
} as const satisfies Record<AiRequirementPriority, number>;

export const CATEGORY_WEIGHTS = {
  requiredRequirements: 0.5,
  experienceRelevance: 0.2,
  projectEvidence: 0.15,
  preferredSkills: 0.1,
  cvClarity: 0.05,
} as const;

export const CV_TEXT_QUALITY_BASE_SCORE = {
  good: 90,
  medium: 65,
  poor: 35,
} as const satisfies Record<AiInputQuality["cv_text_quality"], number>;

export const ANALYSIS_RELIABILITY_PENALTY = {
  high: 0,
  medium: 5,
  low: 15,
} as const satisfies Record<AiInputQuality["analysis_reliability"], number>;

export const CV_WARNING_SCORE_PENALTY = 5;
export const MAX_CV_WARNING_SCORE_PENALTY = 20;
