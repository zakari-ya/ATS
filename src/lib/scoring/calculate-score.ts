import { getBackendMatchStrength, getConfidenceAdjustment, isRequirementMatched } from "@/lib/scoring/match-strength";
import { applyScoreCaps, getAppliedScoreCaps } from "@/lib/scoring/score-caps";
import { formatScoreLabel, getScoreLabel } from "@/lib/scoring/score-labels";
import {
  ANALYSIS_RELIABILITY_PENALTY,
  CATEGORY_WEIGHTS,
  CV_TEXT_QUALITY_BASE_SCORE,
  CV_WARNING_SCORE_PENALTY,
  MAX_CV_WARNING_SCORE_PENALTY,
  PRIORITY_WEIGHTS,
  SCORING_VERSION,
} from "@/lib/scoring/scoring-config";
import type { AiCvMatchResponse, AiMatchMatrixItem, AiRequirementPriority } from "@/types/ai";
import type {
  CvMatchScoreResult,
  RequirementMatchCount,
  ScoreBreakdown,
} from "@/types/scoring";

const REQUIRED_PRIORITIES = ["critical", "required"] as const;
const ROUNDING_PRECISION = 2;

export function calculateCvMatchScore(
  aiResponse: AiCvMatchResponse
): CvMatchScoreResult {
  const counts = calculateRequirementMatchCounts(aiResponse.match_matrix);
  const requiredRequirementsScore = calculateRequirementScore(
    aiResponse.match_matrix,
    REQUIRED_PRIORITIES,
    0
  );
  const preferredSkillsScore = calculateRequirementScore(
    aiResponse.match_matrix,
    ["preferred"],
    100
  );
  const experienceRelevanceScore =
    calculateExperienceRelevanceScore(aiResponse);
  const projectEvidenceScore = calculateProjectEvidenceScore(aiResponse);
  const cvClarityScore = calculateCvClarityScore(aiResponse);

  const baseWeightedScore = roundScore(
    requiredRequirementsScore * CATEGORY_WEIGHTS.requiredRequirements +
      experienceRelevanceScore * CATEGORY_WEIGHTS.experienceRelevance +
      projectEvidenceScore * CATEGORY_WEIGHTS.projectEvidence +
      preferredSkillsScore * CATEGORY_WEIGHTS.preferredSkills +
      cvClarityScore * CATEGORY_WEIGHTS.cvClarity
  );

  const appliedCaps = getAppliedScoreCaps({
    counts,
    inputQuality: aiResponse.input_quality,
  });
  const finalScore = Math.round(applyScoreCaps(baseWeightedScore, appliedCaps));
  const finalLabel = getScoreLabel(finalScore);

  const breakdown: ScoreBreakdown = {
    requiredRequirementsScore,
    preferredSkillsScore,
    experienceRelevanceScore,
    projectEvidenceScore,
    cvClarityScore,
    baseWeightedScore,
    finalScore,
    finalLabel,
    appliedCaps,
  };

  return {
    scoreVersion: SCORING_VERSION,
    finalScore,
    finalLabel,
    labelText: formatScoreLabel(finalLabel),
    breakdown,
    counts,
    inputQuality: aiResponse.input_quality,
  };
}

function calculateRequirementScore(
  items: AiMatchMatrixItem[],
  priorities: readonly AiRequirementPriority[],
  fallbackScore: number
): number {
  const relevantItems = items.filter((item) =>
    priorities.includes(item.priority)
  );

  if (relevantItems.length === 0) {
    return fallbackScore;
  }

  const totals = relevantItems.reduce(
    (result, item) => {
      const priorityWeight = PRIORITY_WEIGHTS[item.priority];
      const confidenceAdjustment = getConfidenceAdjustment(item.confidence);
      const backendStrength = getBackendMatchStrength(item.match_status);

      return {
        earned:
          result.earned +
          priorityWeight * backendStrength * confidenceAdjustment,
        possible: result.possible + priorityWeight,
      };
    },
    { earned: 0, possible: 0 }
  );

  if (totals.possible === 0) {
    return fallbackScore;
  }

  return roundScore((totals.earned / totals.possible) * 100);
}

function calculateRequirementMatchCounts(
  items: AiMatchMatrixItem[]
): RequirementMatchCount {
  return items.reduce<RequirementMatchCount>(
    (counts, item) => {
      const isMissing = item.match_status === "missing";
      const isMatched = isRequirementMatched(item.match_status);

      if (item.priority === "critical") {
        counts.totalCriticalCount += 1;
        counts.missingCriticalCount += isMissing ? 1 : 0;
        counts.matchedRequiredCount += isMatched ? 1 : 0;
      }

      if (item.priority === "required") {
        counts.totalRequiredCount += 1;
        counts.missingRequiredCount += isMissing ? 1 : 0;
        counts.matchedRequiredCount += isMatched ? 1 : 0;
      }

      if (item.priority === "preferred") {
        counts.totalPreferredCount += 1;
        counts.missingPreferredCount += isMissing ? 1 : 0;
        counts.matchedPreferredCount += isMatched ? 1 : 0;
      }

      return counts;
    },
    {
      totalCriticalCount: 0,
      missingCriticalCount: 0,
      totalRequiredCount: 0,
      missingRequiredCount: 0,
      totalPreferredCount: 0,
      missingPreferredCount: 0,
      matchedRequiredCount: 0,
      matchedPreferredCount: 0,
    }
  );
}

function calculateExperienceRelevanceScore(
  aiResponse: AiCvMatchResponse
): number {
  const coreItems = aiResponse.match_matrix.filter((item) =>
    isRequiredPriority(item.priority)
  );
  const averageCoreStrength =
    coreItems.length > 0
      ? average(
          coreItems.map(
            (item) => getBackendMatchStrength(item.match_status) * 100
          )
        )
      : 50;
  const evidenceLength =
    aiResponse.cv_profile.experience_summary.evidence.trim().length;
  const weakEvidencePenalty = evidenceLength < 40 ? 15 : 0;
  const projectSignal = aiResponse.cv_profile.projects.length > 0 ? 5 : 0;
  const reliabilityPenalty =
    ANALYSIS_RELIABILITY_PENALTY[
      aiResponse.input_quality.analysis_reliability
    ];

  return roundScore(
    clampScore(
      averageCoreStrength -
        weakEvidencePenalty -
        reliabilityPenalty +
        projectSignal
    )
  );
}

function calculateProjectEvidenceScore(aiResponse: AiCvMatchResponse): number {
  const projects = aiResponse.cv_profile.projects;

  if (projects.length === 0) {
    return 35;
  }

  const projectCountScore = (Math.min(projects.length, 3) / 3) * 35;
  const evidenceScore =
    (projects.filter((project) => project.evidence.trim().length >= 50)
      .length /
      projects.length) *
    25;
  const relevantSkillCount = projects.reduce(
    (count, project) => count + project.relevant_skills.length,
    0
  );
  const skillCoverageScore = (Math.min(relevantSkillCount, 8) / 8) * 20;
  const relationScore = calculateProjectRequirementRelationScore(aiResponse);

  return roundScore(
    clampScore(
      projectCountScore + evidenceScore + skillCoverageScore + relationScore
    )
  );
}

function calculateProjectRequirementRelationScore(
  aiResponse: AiCvMatchResponse
): number {
  const matchedRequirementNames = new Set(
    aiResponse.match_matrix
      .filter((item) => isRequirementMatched(item.match_status))
      .map((item) => normalizeComparableText(item.requirement))
  );

  if (matchedRequirementNames.size === 0) {
    return 0;
  }

  const projectSkills = aiResponse.cv_profile.projects.flatMap((project) =>
    project.relevant_skills.map(normalizeComparableText)
  );
  const relatedSkillCount = projectSkills.filter((skill) =>
    matchedRequirementNames.has(skill)
  ).length;

  return (Math.min(relatedSkillCount, 4) / 4) * 20;
}

function calculateCvClarityScore(aiResponse: AiCvMatchResponse): number {
  const baseScore =
    CV_TEXT_QUALITY_BASE_SCORE[aiResponse.input_quality.cv_text_quality];
  const warningPenalty = Math.min(
    aiResponse.input_quality.warnings.length * CV_WARNING_SCORE_PENALTY,
    MAX_CV_WARNING_SCORE_PENALTY
  );

  return roundScore(clampScore(baseScore - warningPenalty));
}

function isRequiredPriority(priority: AiRequirementPriority): boolean {
  return priority === "critical" || priority === "required";
}

function average(values: number[]): number {
  if (values.length === 0) {
    return 0;
  }

  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function normalizeComparableText(value: string): string {
  return value.trim().toLowerCase();
}

function clampScore(score: number): number {
  return Math.min(100, Math.max(0, score));
}

function roundScore(score: number): number {
  return Number(score.toFixed(ROUNDING_PRECISION));
}
