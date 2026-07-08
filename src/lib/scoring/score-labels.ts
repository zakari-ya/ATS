import type { ScoreLabel } from "@/types/scoring";

export const SCORE_LABEL_TEXT = {
  great_match: "Great match",
  good_match: "Good match",
  needs_improvement: "Needs improvement",
  low_match: "Low match",
} as const satisfies Record<ScoreLabel, string>;

export function getScoreLabel(score: number): ScoreLabel {
  if (score >= 85) {
    return "great_match";
  }

  if (score >= 70) {
    return "good_match";
  }

  if (score >= 50) {
    return "needs_improvement";
  }

  return "low_match";
}

export function formatScoreLabel(label: ScoreLabel): string {
  return SCORE_LABEL_TEXT[label];
}
