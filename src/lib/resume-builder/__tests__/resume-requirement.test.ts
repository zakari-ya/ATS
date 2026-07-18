import { describe, expect, it } from "vitest";

import {
  classifyResumeRequirement,
  getRequirementQuestion,
} from "@/lib/resume-builder/resume-requirement";

describe("resume requirement classification", () => {
  it("classifies years of experience as experience, not a skill", () => {
    expect(
      classifyResumeRequirement({
        requirement: "7 years of experience",
        category: "backend",
      })
    ).toBe("experience");
  });

  it("supports French experience requirements", () => {
    expect(
      classifyResumeRequirement({
        requirement: "3 ans d’expérience professionnelle",
        category: "expérience",
      })
    ).toBe("experience");
  });

  it("classifies education, certification, and language requirements", () => {
    expect(
      classifyResumeRequirement({ requirement: "Bachelor's degree" })
    ).toBe("education");
    expect(
      classifyResumeRequirement({ requirement: "AWS certification" })
    ).toBe("certification");
    expect(
      classifyResumeRequirement({
        requirement: "Professional English proficiency",
        category: "language",
      })
    ).toBe("language");
  });

  it("keeps technical requirements as skills", () => {
    expect(
      classifyResumeRequirement({
        requirement: "PostgreSQL",
        category: "backend",
      })
    ).toBe("skill");
  });

  it("uses category-specific confirmation questions", () => {
    expect(getRequirementQuestion("experience")).toBe(
      "Do you meet this experience requirement?"
    );
    expect(getRequirementQuestion("skill")).toBe(
      "Have you used this skill before?"
    );
  });
});
