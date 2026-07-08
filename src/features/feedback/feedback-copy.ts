import { formatScoreLabel } from "@/lib/scoring/score-labels";
import type {
  FeedbackAppliedCap,
  FeedbackScoreBreakdown,
  FeedbackSkillItem,
} from "@/features/feedback/types";
import type { ScanLabel, ScanStatus } from "@/types/scan";

export function formatResultLabel(label: ScanLabel | null): string {
  return label ? formatScoreLabel(label) : "Not scored";
}

export function formatScore(value: number | null): string {
  if (value === null) {
    return "Not ready";
  }

  return `${Math.round(value)}%`;
}

export function formatStatus(status: ScanStatus): string {
  return status.replaceAll("_", " ");
}

export function formatMatchStatus(
  status: FeedbackSkillItem["matchStatus"]
): string {
  if (!status) {
    return "Not specified";
  }

  return status.replaceAll("_", " ");
}

export function formatPriority(
  priority: FeedbackSkillItem["priority"]
): string {
  if (!priority) {
    return "Requirement";
  }

  return priority;
}

export function formatDateTime(value: string | null): string {
  if (!value) {
    return "Not completed yet";
  }

  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

export function getScoreExplanation({
  label,
  score,
  missingRequiredCount,
  missingPreferredCount,
}: {
  label: ScanLabel | null;
  score: number | null;
  missingRequiredCount: number;
  missingPreferredCount: number;
}): string {
  if (score === null || !label) {
    return "The score will appear after the analysis completes.";
  }

  if (missingRequiredCount > 0) {
    return `Your CV has useful matches, but ${missingRequiredCount} required item${missingRequiredCount === 1 ? " is" : "s are"} not clearly visible.`;
  }

  if (missingPreferredCount > 0) {
    return "Core requirements look stronger than optional items. Preferred gaps have a smaller impact.";
  }

  if (label === "great_match") {
    return "Your CV has strong visible evidence for the main requirements in this job post.";
  }

  if (label === "good_match") {
    return "Your CV covers many important requirements, with a few areas to make clearer.";
  }

  if (label === "needs_improvement") {
    return "Your CV shows some relevant evidence, but important requirements need stronger support.";
  }

  return "Your CV needs clearer evidence for the main requirements in this job post.";
}

export function getAnalysisSummary({
  matchedCount,
  missingRequiredCount,
  missingPreferredCount,
  recommendationsCount,
}: {
  matchedCount: number;
  missingRequiredCount: number;
  missingPreferredCount: number;
  recommendationsCount: number;
}): string {
  return [
    `${matchedCount} matched requirement${matchedCount === 1 ? "" : "s"}`,
    `${missingRequiredCount} missing required item${missingRequiredCount === 1 ? "" : "s"}`,
    `${missingPreferredCount} missing preferred item${missingPreferredCount === 1 ? "" : "s"}`,
    `${recommendationsCount} recommendation${recommendationsCount === 1 ? "" : "s"}`,
  ].join(" · ");
}

export function getCapIntro(appliedCaps: FeedbackAppliedCap[]): string {
  if (appliedCaps.length === 0) {
    return "No score caps were applied to this analysis.";
  }

  return "The score was limited by one or more important analysis rules.";
}

export function getBreakdownDescription(
  key: keyof FeedbackScoreBreakdown
): string {
  const descriptions: Record<keyof FeedbackScoreBreakdown, string> = {
    requiredRequirementsScore:
      "Critical and required items carry the largest weight.",
    preferredSkillsScore: "Optional items help, but have a smaller impact.",
    experienceRelevanceScore:
      "Measures how clearly the CV supports the role level and context.",
    projectEvidenceScore:
      "Rewards concrete work or project evidence tied to the job.",
    cvClarityScore: "Reflects readable, text-based CV quality.",
    baseWeightedScore: "Weighted score before caps are applied.",
    finalScore: "Final backend-controlled score after caps.",
  };

  return descriptions[key];
}
