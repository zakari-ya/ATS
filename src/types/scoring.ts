import type { AiInputQuality } from "@/types/ai";

export type ScoreLabel =
  | "great_match"
  | "good_match"
  | "needs_improvement"
  | "low_match";

export type ScoreCategoryName =
  | "requiredRequirementsScore"
  | "preferredSkillsScore"
  | "experienceRelevanceScore"
  | "projectEvidenceScore"
  | "cvClarityScore";

export type AppliedScoreCapCode =
  | "ONE_CRITICAL_REQUIREMENT_MISSING"
  | "MULTIPLE_CRITICAL_REQUIREMENTS_MISSING"
  | "ONE_REQUIRED_REQUIREMENT_MISSING"
  | "MULTIPLE_REQUIRED_REQUIREMENTS_MISSING"
  | "MOST_REQUIRED_REQUIREMENTS_MISSING"
  | "POOR_CV_TEXT_QUALITY"
  | "POOR_JOB_DESCRIPTION_QUALITY"
  | "LOW_ANALYSIS_RELIABILITY";

export type AppliedScoreCap = {
  code: AppliedScoreCapCode;
  maxScore: number;
  reason: string;
};

export type RequirementMatchCount = {
  totalCriticalCount: number;
  missingCriticalCount: number;
  totalRequiredCount: number;
  missingRequiredCount: number;
  totalPreferredCount: number;
  missingPreferredCount: number;
  matchedRequiredCount: number;
  matchedPreferredCount: number;
};

export type ScoreBreakdown = {
  requiredRequirementsScore: number;
  preferredSkillsScore: number;
  experienceRelevanceScore: number;
  projectEvidenceScore: number;
  cvClarityScore: number;
  baseWeightedScore: number;
  finalScore: number;
  finalLabel: ScoreLabel;
  appliedCaps: AppliedScoreCap[];
};

export type CvMatchScoreResult = {
  scoreVersion: string;
  finalScore: number;
  finalLabel: ScoreLabel;
  labelText: string;
  breakdown: ScoreBreakdown;
  counts: RequirementMatchCount;
  inputQuality: AiInputQuality;
};
