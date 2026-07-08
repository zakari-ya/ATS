import { calculateCvMatchScore } from "@/lib/scoring/calculate-score";
import { getBackendMatchStrength } from "@/lib/scoring/match-strength";
import { formatScoreLabel, getScoreLabel } from "@/lib/scoring/score-labels";
import type { AiCvMatchResponse, AiMatchMatrixItem } from "@/types/ai";
import type { ScoreLabel } from "@/types/scoring";

const exactRequiredMatch: AiMatchMatrixItem = {
  requirement: "React",
  priority: "required",
  category: "frontend",
  match_status: "exact_match",
  match_strength: 1,
  confidence: 0.95,
  job_evidence: "React experience is required.",
  cv_evidence: "Built React dashboards.",
  reason: "The CV directly mentions React work.",
};

const exactCriticalMatch: AiMatchMatrixItem = {
  requirement: "PostgreSQL",
  priority: "critical",
  category: "database",
  match_status: "exact_match",
  match_strength: 1,
  confidence: 0.92,
  job_evidence: "PostgreSQL is required for this role.",
  cv_evidence: "Created PostgreSQL schemas and queries.",
  reason: "The CV directly mentions PostgreSQL work.",
};

const exactPreferredMatch: AiMatchMatrixItem = {
  requirement: "Docker",
  priority: "preferred",
  category: "devops",
  match_status: "exact_match",
  match_strength: 1,
  confidence: 0.9,
  job_evidence: "Docker is a plus.",
  cv_evidence: "Containerized apps with Docker.",
  reason: "The CV directly mentions Docker work.",
};

const baseScoringAiResponseFixture: AiCvMatchResponse = {
  input_quality: {
    cv_text_quality: "good",
    job_description_quality: "good",
    analysis_reliability: "high",
    warnings: [],
  },
  job_profile: {
    role_title: "Full Stack Developer",
    seniority: "mid",
    required_skills: [
      {
        name: "React",
        category: "frontend",
        priority: "required",
        evidence: "React experience is required.",
      },
      {
        name: "PostgreSQL",
        category: "database",
        priority: "critical",
        evidence: "PostgreSQL is required for this role.",
      },
    ],
    preferred_skills: [
      {
        name: "Docker",
        category: "devops",
        priority: "preferred",
        evidence: "Docker is a plus.",
      },
    ],
    responsibilities: ["Build product features across frontend and backend."],
    experience_requirements: {
      minimum_years: 2,
      level: "mid",
      evidence: "2+ years of product engineering experience.",
    },
  },
  cv_profile: {
    detected_role: "Full Stack Developer",
    skills: [
      {
        name: "React",
        category: "frontend",
        evidence: "Built React dashboards.",
      },
      {
        name: "PostgreSQL",
        category: "database",
        evidence: "Created PostgreSQL schemas and queries.",
      },
      {
        name: "Docker",
        category: "devops",
        evidence: "Containerized apps with Docker.",
      },
    ],
    projects: [
      {
        name: "Analytics workspace",
        relevant_skills: ["React", "PostgreSQL", "Docker"],
        evidence:
          "Built an analytics workspace using React, PostgreSQL, and Docker deployment workflows.",
      },
    ],
    experience_summary: {
      estimated_level: "mid",
      evidence:
        "The CV shows product engineering work across frontend, database, and deployment tasks.",
    },
  },
  match_matrix: [
    exactCriticalMatch,
    exactRequiredMatch,
    exactPreferredMatch,
  ],
  feedback_inputs: {
    strong_points: ["The CV shows strong product engineering evidence."],
    missing_required_items: [],
    missing_preferred_items: [],
    weak_points: [],
    recommended_cv_improvements: [
      "Keep the strongest project evidence close to the role requirements.",
    ],
  },
};

function withMatchMatrix(
  matchMatrix: AiMatchMatrixItem[]
): AiCvMatchResponse {
  return {
    ...baseScoringAiResponseFixture,
    match_matrix: matchMatrix,
  };
}

function missingItem(item: AiMatchMatrixItem): AiMatchMatrixItem {
  return {
    ...item,
    match_status: "missing",
    match_strength: 0,
    cv_evidence: null,
    reason: "This requirement is not visible in the CV text.",
  };
}

export const scoringFixtureExamples = {
  perfectExactMatches: {
    result: calculateCvMatchScore(baseScoringAiResponseFixture),
    expectedLabel: "great_match" satisfies ScoreLabel,
  },
  oneRequiredMissing: {
    result: calculateCvMatchScore(
      withMatchMatrix([
        exactCriticalMatch,
        missingItem(exactRequiredMatch),
        exactPreferredMatch,
      ])
    ),
    expectedMaximumAllowedScore: 84,
  },
  twoRequiredMissing: {
    result: calculateCvMatchScore(
      withMatchMatrix([
        exactCriticalMatch,
        missingItem(exactRequiredMatch),
        missingItem({
          ...exactRequiredMatch,
          requirement: "Node.js",
          job_evidence: "Node.js API work is required.",
        }),
        exactPreferredMatch,
      ])
    ),
    expectedMaximumAllowedScore: 69,
  },
  oneCriticalMissing: {
    result: calculateCvMatchScore(
      withMatchMatrix([
        missingItem(exactCriticalMatch),
        exactRequiredMatch,
        exactPreferredMatch,
      ])
    ),
    expectedMaximumAllowedScore: 79,
  },
  twoCriticalMissing: {
    result: calculateCvMatchScore(
      withMatchMatrix([
        missingItem(exactCriticalMatch),
        missingItem({
          ...exactCriticalMatch,
          requirement: "Security review",
          job_evidence: "Security review experience is critical.",
        }),
        exactRequiredMatch,
        exactPreferredMatch,
      ])
    ),
    expectedMaximumAllowedScore: 59,
  },
  poorCvTextQuality: {
    result: calculateCvMatchScore({
      ...baseScoringAiResponseFixture,
      input_quality: {
        ...baseScoringAiResponseFixture.input_quality,
        cv_text_quality: "poor",
      },
    }),
    expectedMaximumAllowedScore: 60,
  },
  preferredMissing: {
    result: calculateCvMatchScore(
      withMatchMatrix([
        exactCriticalMatch,
        exactRequiredMatch,
        missingItem(exactPreferredMatch),
      ])
    ),
    expectedMinimumScore: 70,
  },
  backendStrengths: {
    semanticMatch: getBackendMatchStrength("semantic_match"),
    unclear: getBackendMatchStrength("unclear"),
    expectedSemanticMatch: 0.85,
    expectedUnclear: 0.25,
  },
  labels: {
    great: formatScoreLabel(getScoreLabel(92)),
    good: formatScoreLabel(getScoreLabel(74)),
    needsImprovement: formatScoreLabel(getScoreLabel(58)),
    low: formatScoreLabel(getScoreLabel(40)),
  },
} as const;
