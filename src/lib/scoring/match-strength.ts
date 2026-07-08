import type { AiMatchStatus } from "@/types/ai";

export const BACKEND_MATCH_STRENGTH = {
  exact_match: 1,
  semantic_match: 0.85,
  partial_match: 0.5,
  unclear: 0.25,
  missing: 0,
} as const satisfies Record<AiMatchStatus, number>;

export const MATCHED_REQUIREMENT_STATUSES = [
  "exact_match",
  "semantic_match",
  "partial_match",
] as const satisfies AiMatchStatus[];

export function getBackendMatchStrength(status: AiMatchStatus): number {
  return BACKEND_MATCH_STRENGTH[status];
}

export function getConfidenceAdjustment(confidence: number): number {
  if (confidence >= 0.85) {
    return 1;
  }

  if (confidence >= 0.65) {
    return 0.9;
  }

  if (confidence >= 0.45) {
    return 0.75;
  }

  return 0.5;
}

export function isRequirementMatched(status: AiMatchStatus): boolean {
  return MATCHED_REQUIREMENT_STATUSES.includes(
    status as (typeof MATCHED_REQUIREMENT_STATUSES)[number]
  );
}
