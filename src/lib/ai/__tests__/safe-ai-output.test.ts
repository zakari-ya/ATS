import { describe, expect, it } from "vitest";

import {
  SafeAiOutputValidationError,
  parseAiCvMatchResponse,
  safeParseAiCvMatchResponse,
} from "@/lib/ai/safe-ai-output";

function buildValidAiJson() {
  return {
    input_quality: {
      cv_text_quality: "good",
      job_description_quality: "good",
      analysis_reliability: "high",
      warnings: [],
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
      preferred_skills: [],
      responsibilities: ["Build backend services"],
      experience_requirements: {
        minimum_years: 3,
        level: "mid",
        evidence: "Three years of experience preferred.",
      },
    },
    cv_profile: {
      detected_role: "Backend Engineer",
      skills: [
        {
          name: "Node.js",
          category: "backend",
          evidence: "Built Node.js APIs.",
        },
      ],
      projects: [
        {
          name: "Payments API",
          relevant_skills: ["Node.js"],
          evidence:
            "Built a production API with Node.js and measurable backend work.",
        },
      ],
      experience_summary: {
        estimated_level: "mid",
        evidence:
          "Three years of backend API work are visible in the CV content.",
      },
    },
    match_matrix: [
      {
        requirement: "Node.js",
        priority: "required",
        category: "backend",
        match_status: "exact_match",
        match_strength: 1,
        confidence: 0.95,
        job_evidence: "Node.js is required.",
        cv_evidence: "Built Node.js APIs.",
        reason: "Node.js is clearly visible in the CV.",
      },
    ],
    feedback_inputs: {
      strong_points: ["The CV shows clear backend API experience."],
      missing_required_items: [],
      missing_preferred_items: [],
      weak_points: ["Optional tooling is less visible."],
      recommended_cv_improvements: [
        "Add truthful deployment details where they help clarify your work.",
      ],
    },
  };
}

describe("safe AI output parsing", () => {
  it("returns ok for a valid object input", () => {
    const result = safeParseAiCvMatchResponse(buildValidAiJson());

    expect(result.ok).toBe(true);
  });

  it("returns ok for a valid JSON string input", () => {
    const result = safeParseAiCvMatchResponse(
      JSON.stringify(buildValidAiJson())
    );

    expect(result.ok).toBe(true);
  });

  it("returns a safe error for malformed JSON strings", () => {
    const result = safeParseAiCvMatchResponse("{bad json");

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errorCode).toBe("AI_JSON_INVALID");
      expect(result.issues[0]?.message).toContain("valid JSON");
    }
  });

  it("fails when extra strict fields are present", () => {
    const input = {
      ...buildValidAiJson(),
      final_score: 99,
    };

    const result = safeParseAiCvMatchResponse(input);

    expect(result.ok).toBe(false);
  });

  it("returns safe validation issues for invalid schema input", () => {
    const input = buildValidAiJson();
    input.match_matrix[0].confidence = 99;

    const result = safeParseAiCvMatchResponse(input);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.issues.length).toBeGreaterThan(0);
      expect(result.issues[0]).toHaveProperty("path");
      expect(result.issues[0]).toHaveProperty("message");
    }
  });

  it("never throws from safeParseAiCvMatchResponse", () => {
    expect(() =>
      safeParseAiCvMatchResponse({
        input_quality: null,
      })
    ).not.toThrow();
  });

  it("throws only the safe validation error class from parseAiCvMatchResponse", () => {
    expect(() => parseAiCvMatchResponse("{bad json")).toThrow(
      SafeAiOutputValidationError
    );
  });
});
