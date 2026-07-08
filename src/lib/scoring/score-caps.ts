import type { AiInputQuality } from "@/types/ai";
import type { AppliedScoreCap, RequirementMatchCount } from "@/types/scoring";

type ScoreCapInput = {
  counts: RequirementMatchCount;
  inputQuality: AiInputQuality;
};

export function getAppliedScoreCaps({
  counts,
  inputQuality,
}: ScoreCapInput): AppliedScoreCap[] {
  const caps: AppliedScoreCap[] = [];

  if (counts.missingCriticalCount === 1) {
    caps.push({
      code: "ONE_CRITICAL_REQUIREMENT_MISSING",
      maxScore: 79,
      reason:
        "One critical requirement is not visible in the CV, so the score is capped.",
    });
  }

  if (counts.missingCriticalCount >= 2) {
    caps.push({
      code: "MULTIPLE_CRITICAL_REQUIREMENTS_MISSING",
      maxScore: 59,
      reason:
        "Multiple critical requirements are not visible in the CV, so the score is capped.",
    });
  }

  if (counts.missingRequiredCount === 1) {
    caps.push({
      code: "ONE_REQUIRED_REQUIREMENT_MISSING",
      maxScore: 84,
      reason:
        "One required requirement is not visible in the CV, so the score is capped.",
    });
  }

  if (counts.missingRequiredCount >= 2) {
    caps.push({
      code: "MULTIPLE_REQUIRED_REQUIREMENTS_MISSING",
      maxScore: 69,
      reason:
        "Multiple required requirements are not visible in the CV, so the score is capped.",
    });
  }

  const totalCoreRequirements =
    counts.totalCriticalCount + counts.totalRequiredCount;
  const missingCoreRequirements =
    counts.missingCriticalCount + counts.missingRequiredCount;

  if (
    totalCoreRequirements >= 3 &&
    missingCoreRequirements / totalCoreRequirements >= 0.5
  ) {
    caps.push({
      code: "MOST_REQUIRED_REQUIREMENTS_MISSING",
      maxScore: 49,
      reason:
        "Most required or critical requirements are not visible in the CV, so the score is capped.",
    });
  }

  if (inputQuality.cv_text_quality === "poor") {
    caps.push({
      code: "POOR_CV_TEXT_QUALITY",
      maxScore: 60,
      reason:
        "The extracted CV text quality is poor, so the score is capped.",
    });
  }

  if (inputQuality.job_description_quality === "poor") {
    caps.push({
      code: "POOR_JOB_DESCRIPTION_QUALITY",
      maxScore: 75,
      reason:
        "The job description quality is poor, so the score is capped.",
    });
  }

  if (inputQuality.analysis_reliability === "low") {
    caps.push({
      code: "LOW_ANALYSIS_RELIABILITY",
      maxScore: 75,
      reason:
        "The analysis reliability is low, so the score is capped.",
    });
  }

  return caps;
}

export function applyScoreCaps(
  baseScore: number,
  appliedCaps: AppliedScoreCap[]
): number {
  const strictestCap = appliedCaps.reduce(
    (currentMax, cap) => Math.min(currentMax, cap.maxScore),
    100
  );

  return Math.min(baseScore, strictestCap);
}
