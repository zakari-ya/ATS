import type { CvMatchScoreResult } from "@/types/scoring";

const MAX_EXPLANATIONS = 5;

export function buildScoreExplanations(
  scoreResult: CvMatchScoreResult
): string[] {
  const explanations: string[] = [];
  const { counts, breakdown, finalLabel } = scoreResult;

  if (finalLabel === "great_match") {
    explanations.push(
      "Your CV matches the core requirements well and has strong supporting evidence."
    );
  } else if (finalLabel === "good_match") {
    explanations.push(
      "Your CV covers many important requirements, with a few areas that could be clearer."
    );
  } else if (finalLabel === "needs_improvement") {
    explanations.push(
      "Your CV shows some relevant evidence, but important requirements need clearer support."
    );
  } else {
    explanations.push(
      "Your CV needs stronger visible evidence for the main requirements in this job post."
    );
  }

  if (counts.missingCriticalCount > 0) {
    explanations.push(
      "One or more critical requirements are not visible in the CV, which limits the score."
    );
  } else if (counts.missingRequiredCount === 1) {
    explanations.push(
      "One required requirement is not visible in the CV, so the score is capped."
    );
  } else if (counts.missingRequiredCount > 1) {
    explanations.push(
      "Multiple required requirements are not visible in the CV, so the score is capped."
    );
  }

  if (counts.missingPreferredCount > 0) {
    explanations.push(
      "Preferred skills are missing, but they have a smaller impact than required skills."
    );
  }

  if (breakdown.projectEvidenceScore < 60) {
    explanations.push(
      "Project or work evidence could be more specific and tied to the job requirements."
    );
  }

  if (breakdown.cvClarityScore < 70) {
    explanations.push(
      "The CV text quality or readability lowered the score. A clearer text-based CV may improve the analysis."
    );
  }

  const strictestCap = [...breakdown.appliedCaps].sort(
    (first, second) => first.maxScore - second.maxScore
  )[0];

  if (strictestCap) {
    explanations.push(strictestCap.reason);
  }

  return Array.from(new Set(explanations)).slice(0, MAX_EXPLANATIONS);
}
