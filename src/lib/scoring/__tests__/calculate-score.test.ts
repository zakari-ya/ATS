import { describe, expect, it } from "vitest";

import { aiCvMatchResponseSchema } from "@/lib/ai/cv-match-schema";
import { calculateCvMatchScore } from "@/lib/scoring/calculate-score";
import { getScoreLabel } from "@/lib/scoring/score-labels";
import type {
  AiCvMatchResponse,
  AiInputQuality,
  AiMatchStatus,
  AiRequirementPriority,
} from "@/types/ai";

function buildAiResponse({
  matchMatrix,
  inputQuality,
}: {
  matchMatrix: Array<{
    requirement: string;
    priority: AiRequirementPriority;
    match_status: AiMatchStatus;
    confidence?: number;
    category?: string;
    cv_evidence?: string | null;
    job_evidence?: string;
    reason?: string;
  }>;
  inputQuality?: Partial<AiInputQuality>;
}): AiCvMatchResponse {
  return aiCvMatchResponseSchema.parse({
    input_quality: {
      cv_text_quality: "good",
      job_description_quality: "good",
      analysis_reliability: "high",
      warnings: [],
      ...inputQuality,
    },
    job_profile: {
      role_title: "Backend Engineer",
      seniority: "mid",
      required_skills: [
        {
          name: "Node.js",
          category: "backend",
          priority: "required",
          evidence: "Node.js is required.",
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
      responsibilities: ["Build backend services"],
      experience_requirements: {
        minimum_years: 3,
        level: "mid",
        evidence: "Three years of backend experience are preferred.",
      },
    },
    cv_profile: {
      detected_role: "Backend Engineer",
      skills: [
        {
          name: "Node.js",
          category: "backend",
          evidence: "Built backend APIs with Node.js.",
        },
      ],
      projects: [
        {
          name: "Payments API",
          relevant_skills: ["Node.js", "Docker", "PostgreSQL"],
          evidence:
            "Built and deployed a production API with Node.js, Docker, and PostgreSQL integrations.",
        },
      ],
      experience_summary: {
        estimated_level: "mid",
        evidence:
          "Three years of backend API work across Node.js services and production deployments.",
      },
    },
    match_matrix: matchMatrix.map((item) => ({
      requirement: item.requirement,
      priority: item.priority,
      category: item.category ?? "backend",
      match_status: item.match_status,
      match_strength:
        item.match_status === "exact_match"
          ? 1
          : item.match_status === "semantic_match"
            ? 0.85
            : item.match_status === "partial_match"
              ? 0.5
              : item.match_status === "unclear"
                ? 0.25
                : 0,
      confidence: item.confidence ?? 0.95,
      job_evidence: item.job_evidence ?? `${item.requirement} is required.`,
      cv_evidence:
        item.match_status === "missing"
          ? null
          : item.cv_evidence ?? `${item.requirement} appears clearly in the CV.`,
      reason: item.reason ?? `${item.requirement} comparison.`,
    })),
    feedback_inputs: {
      strong_points: ["Strong backend fundamentals are visible."],
      missing_required_items: [],
      missing_preferred_items: [],
      weak_points: ["Some optional tooling is less visible."],
      recommended_cv_improvements: [
        "Add truthful deployment details where they help clarify your work.",
      ],
    },
  });
}

describe("calculateCvMatchScore", () => {
  it("returns great_match for strong exact matches", () => {
    const response = buildAiResponse({
      matchMatrix: [
        { requirement: "Node.js", priority: "required", match_status: "exact_match" },
        { requirement: "PostgreSQL", priority: "required", match_status: "exact_match" },
        { requirement: "System design", priority: "critical", match_status: "exact_match" },
        { requirement: "Docker", priority: "preferred", match_status: "exact_match" },
      ],
    });

    const result = calculateCvMatchScore(response);

    expect(result.finalLabel).toBe("great_match");
    expect(result.finalScore).toBeGreaterThanOrEqual(85);
  });

  it("uses backend match strengths instead of trusting AI numbers", () => {
    const semanticResponse = buildAiResponse({
      matchMatrix: [{ requirement: "Express.js", priority: "required", match_status: "semantic_match" }],
    });
    const partialResponse = buildAiResponse({
      matchMatrix: [{ requirement: "Express.js", priority: "required", match_status: "partial_match" }],
    });
    const unclearResponse = buildAiResponse({
      matchMatrix: [{ requirement: "Express.js", priority: "required", match_status: "unclear", confidence: 0.4 }],
    });
    const missingResponse = buildAiResponse({
      matchMatrix: [{ requirement: "Express.js", priority: "required", match_status: "missing" }],
    });

    const semanticScore = calculateCvMatchScore(semanticResponse);
    const partialScore = calculateCvMatchScore(partialResponse);
    const unclearScore = calculateCvMatchScore(unclearResponse);
    const missingScore = calculateCvMatchScore(missingResponse);

    expect(semanticScore.breakdown.requiredRequirementsScore).toBe(85);
    expect(partialScore.breakdown.requiredRequirementsScore).toBe(50);
    expect(unclearScore.breakdown.requiredRequirementsScore).toBe(12.5);
    expect(missingScore.breakdown.requiredRequirementsScore).toBe(0);
  });

  it("caps one required missing at 84", () => {
    const response = buildAiResponse({
      matchMatrix: [
        { requirement: "Node.js", priority: "required", match_status: "exact_match" },
        { requirement: "PostgreSQL", priority: "required", match_status: "missing" },
        { requirement: "Docker", priority: "preferred", match_status: "exact_match" },
      ],
    });

    const result = calculateCvMatchScore(response);
    expect(result.breakdown.appliedCaps.map((cap) => cap.code)).toContain(
      "ONE_REQUIRED_REQUIREMENT_MISSING"
    );
    expect(result.finalScore).toBeLessThanOrEqual(84);
  });

  it("caps two required missing at 69", () => {
    const response = buildAiResponse({
      matchMatrix: [
        { requirement: "Node.js", priority: "required", match_status: "missing" },
        { requirement: "PostgreSQL", priority: "required", match_status: "missing" },
        { requirement: "Docker", priority: "preferred", match_status: "exact_match" },
      ],
    });

    const result = calculateCvMatchScore(response);
    expect(result.breakdown.appliedCaps.map((cap) => cap.code)).toContain(
      "MULTIPLE_REQUIRED_REQUIREMENTS_MISSING"
    );
    expect(result.finalScore).toBeLessThanOrEqual(69);
  });

  it("caps one critical missing at 79", () => {
    const response = buildAiResponse({
      matchMatrix: [
        { requirement: "Architecture", priority: "critical", match_status: "missing" },
        { requirement: "Node.js", priority: "required", match_status: "exact_match" },
        { requirement: "PostgreSQL", priority: "required", match_status: "exact_match" },
      ],
    });

    const result = calculateCvMatchScore(response);
    expect(result.breakdown.appliedCaps.map((cap) => cap.code)).toContain(
      "ONE_CRITICAL_REQUIREMENT_MISSING"
    );
    expect(result.finalScore).toBeLessThanOrEqual(79);
  });

  it("caps two critical missing at 59", () => {
    const response = buildAiResponse({
      matchMatrix: [
        { requirement: "Architecture", priority: "critical", match_status: "missing" },
        { requirement: "Security", priority: "critical", match_status: "missing" },
        { requirement: "Node.js", priority: "required", match_status: "exact_match" },
      ],
    });

    const result = calculateCvMatchScore(response);
    expect(result.breakdown.appliedCaps.map((cap) => cap.code)).toContain(
      "MULTIPLE_CRITICAL_REQUIREMENTS_MISSING"
    );
    expect(result.finalScore).toBeLessThanOrEqual(59);
  });

  it("caps poor CV text quality at 60", () => {
    const response = buildAiResponse({
      inputQuality: {
        cv_text_quality: "poor",
      },
      matchMatrix: [
        { requirement: "Node.js", priority: "required", match_status: "exact_match" },
        { requirement: "PostgreSQL", priority: "required", match_status: "exact_match" },
        { requirement: "Architecture", priority: "critical", match_status: "exact_match" },
      ],
    });

    const result = calculateCvMatchScore(response);
    expect(result.breakdown.appliedCaps.map((cap) => cap.code)).toContain(
      "POOR_CV_TEXT_QUALITY"
    );
    expect(result.finalScore).toBeLessThanOrEqual(60);
  });

  it("caps low analysis reliability at 75", () => {
    const response = buildAiResponse({
      inputQuality: {
        analysis_reliability: "low",
      },
      matchMatrix: [
        { requirement: "Node.js", priority: "required", match_status: "exact_match" },
        { requirement: "PostgreSQL", priority: "required", match_status: "exact_match" },
        { requirement: "Architecture", priority: "critical", match_status: "exact_match" },
      ],
    });

    const result = calculateCvMatchScore(response);
    expect(result.breakdown.appliedCaps.map((cap) => cap.code)).toContain(
      "LOW_ANALYSIS_RELIABILITY"
    );
    expect(result.finalScore).toBeLessThanOrEqual(75);
  });

  it("lets preferred missing lower score without destroying it", () => {
    const response = buildAiResponse({
      matchMatrix: [
        { requirement: "Node.js", priority: "required", match_status: "exact_match" },
        { requirement: "PostgreSQL", priority: "required", match_status: "exact_match" },
        { requirement: "Architecture", priority: "critical", match_status: "exact_match" },
        { requirement: "Docker", priority: "preferred", match_status: "missing" },
      ],
    });

    const result = calculateCvMatchScore(response);
    expect(result.breakdown.preferredSkillsScore).toBe(0);
    expect(result.finalScore).toBeGreaterThanOrEqual(70);
  });

  it("maps label thresholds correctly", () => {
    expect(getScoreLabel(85)).toBe("great_match");
    expect(getScoreLabel(84)).toBe("good_match");
    expect(getScoreLabel(70)).toBe("good_match");
    expect(getScoreLabel(69)).toBe("needs_improvement");
    expect(getScoreLabel(50)).toBe("needs_improvement");
    expect(getScoreLabel(49)).toBe("low_match");
  });
});
