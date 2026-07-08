import { describe, expect, it } from "vitest";

import {
  AI_MATCH_STRENGTH_BY_STATUS,
  aiCvMatchResponseSchema,
} from "@/lib/ai/cv-match-schema";

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
          relevant_skills: ["Node.js", "Docker"],
          evidence:
            "Built a production API with Node.js and Docker deployment workflows.",
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
        match_strength: AI_MATCH_STRENGTH_BY_STATUS.exact_match,
        confidence: 0.95,
        job_evidence: "Node.js is required.",
        cv_evidence: "Built Node.js APIs.",
        reason: "Node.js is clearly visible in the CV.",
      },
    ],
    feedback_inputs: {
      strong_points: ["The CV shows clear backend API experience."],
      missing_required_items: [],
      missing_preferred_items: ["Docker"],
      weak_points: ["Deployment tooling is less clear."],
      recommended_cv_improvements: [
        "Add truthful Docker deployment details if you have used them.",
      ],
    },
  };
}

describe("aiCvMatchResponseSchema", () => {
  it("passes valid AI JSON", () => {
    const result = aiCvMatchResponseSchema.safeParse(buildValidAiJson());
    expect(result.success).toBe(true);
  });

  it("fails when input_quality is missing", () => {
    const input = buildValidAiJson();
    delete (input as Partial<typeof input>).input_quality;

    const result = aiCvMatchResponseSchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it("fails when match_matrix is missing", () => {
    const input = buildValidAiJson();
    delete (input as Partial<typeof input>).match_matrix;

    const result = aiCvMatchResponseSchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it("fails on invalid priority", () => {
    const input = buildValidAiJson();
    input.match_matrix[0].priority = "optional";

    const result = aiCvMatchResponseSchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it("fails on invalid match_status", () => {
    const input = buildValidAiJson();
    input.match_matrix[0].match_status = "strong_match";

    const result = aiCvMatchResponseSchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it("fails when confidence is above 1", () => {
    const input = buildValidAiJson();
    input.match_matrix[0].confidence = 1.1;

    const result = aiCvMatchResponseSchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it("fails when confidence is below 0", () => {
    const input = buildValidAiJson();
    input.match_matrix[0].confidence = -0.1;

    const result = aiCvMatchResponseSchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it.each([
    "exact_match",
    "semantic_match",
    "partial_match",
  ] as const)("fails when %s has no CV evidence", (status) => {
    const input = buildValidAiJson() as unknown as {
      match_matrix: Array<Record<string, unknown>>;
    };
    input.match_matrix[0] = {
      ...input.match_matrix[0],
      match_status: status,
      match_strength: AI_MATCH_STRENGTH_BY_STATUS[status],
      cv_evidence: null,
    };

    const result = aiCvMatchResponseSchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it("fails when missing includes CV evidence", () => {
    const input = buildValidAiJson() as unknown as {
      match_matrix: Array<Record<string, unknown>>;
    };
    input.match_matrix[0] = {
      ...input.match_matrix[0],
      match_status: "missing",
      match_strength: AI_MATCH_STRENGTH_BY_STATUS.missing,
      cv_evidence: "Node.js appears in the CV.",
    };

    const result = aiCvMatchResponseSchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it("fails when match_strength mismatches the status", () => {
    const input = buildValidAiJson() as unknown as {
      match_matrix: Array<Record<string, unknown>>;
    };
    input.match_matrix[0] = {
      ...input.match_matrix[0],
      match_strength: 0.5,
    };

    const result = aiCvMatchResponseSchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it("fails when evidence is too long", () => {
    const input = buildValidAiJson();
    input.match_matrix[0].job_evidence = "x".repeat(281);

    const result = aiCvMatchResponseSchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it("fails when feedback contains raw HTML", () => {
    const input = buildValidAiJson();
    input.feedback_inputs.strong_points = ["<b>Strong backend experience</b>"];

    const result = aiCvMatchResponseSchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it("fails when feedback contains hiring-decision language", () => {
    const input = buildValidAiJson();
    input.feedback_inputs.strong_points = ["This CV should be accepted."];

    const result = aiCvMatchResponseSchema.safeParse(input);
    expect(result.success).toBe(false);
  });
});
