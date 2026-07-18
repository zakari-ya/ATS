import { describe, expect, it } from "vitest";

import {
  resumeProfileSchema,
  type GroundedString,
  type ResumeProfile,
} from "@/lib/resume-builder/resume-profile-schema";
import {
  collectCandidateFacts,
  collectTrustedFactIds,
  evaluateResumeProfile,
  normalizeResumeProfile,
} from "@/lib/resume-builder/resume-profile-utils";

const SCAN_ID = "00000000-0000-4000-8000-000000000001";

function id(value: number): string {
  return `00000000-0000-4000-8000-${String(value).padStart(12, "0")}`;
}

function fact(
  value: string,
  verificationStatus: GroundedString["verificationStatus"] = "user_provided",
  index = 10
): GroundedString {
  return {
    id: id(index),
    value,
    verificationStatus,
    sources: [
      verificationStatus === "user_provided"
        ? { kind: "user_input" }
        : { kind: "cv_text", scanId: SCAN_ID, excerpt: value },
    ],
  };
}

function createProfile(): ResumeProfile {
  return {
    id: id(1),
    sourceScanId: SCAN_ID,
    schemaVersion: 1,
    basics: {
      fullName: fact("Avery Morgan", "user_provided", 2),
      professionalTitle: fact("Frontend developer", "user_provided", 3),
      email: fact("avery@example.test", "user_provided", 4),
      phone: null,
      location: null,
      linkedin: null,
      github: null,
      portfolio: null,
    },
    summary: fact("Builds accessible web interfaces.", "user_provided", 5),
    skills: [
      {
        id: id(6),
        category: fact("Frontend", "user_provided", 7),
        items: [fact("React", "user_provided", 8)],
      },
    ],
    experience: [],
    projects: [],
    education: [],
    certifications: [],
    languages: [],
  };
}

describe("resume profile schema", () => {
  it("accepts a valid factual profile", () => {
    expect(resumeProfileSchema.safeParse(createProfile()).success).toBe(true);
  });

  it("rejects unknown fields at strict boundaries", () => {
    const profile = { ...createProfile(), unexpected: true };
    expect(resumeProfileSchema.safeParse(profile).success).toBe(false);
  });

  it("rejects empty grounded values", () => {
    const profile = createProfile();
    profile.basics.fullName = { ...profile.basics.fullName!, value: " " };
    expect(resumeProfileSchema.safeParse(profile).success).toBe(false);
  });

  it("requires cv_text provenance for candidate values", () => {
    const profile = createProfile();
    profile.summary = {
      ...fact("Candidate summary", "candidate", 12),
      sources: [{ kind: "user_input" }],
    };
    expect(resumeProfileSchema.safeParse(profile).success).toBe(false);
  });

  it("requires user_input provenance for user-provided values", () => {
    const profile = createProfile();
    profile.summary = {
      ...fact("Directly supplied", "user_provided", 12),
      sources: [{ kind: "cv_text", scanId: SCAN_ID, excerpt: "Directly supplied" }],
    };
    expect(resumeProfileSchema.safeParse(profile).success).toBe(false);
  });

  it("rejects unsafe URL schemes", () => {
    const profile = createProfile();
    profile.basics.portfolio = {
      ...fact("https://portfolio.example.test", "user_provided", 13),
      value: "javascript:alert(1)",
    };
    expect(resumeProfileSchema.safeParse(profile).success).toBe(false);
  });

  it("rejects invalid email values", () => {
    const profile = createProfile();
    profile.basics.email = {
      ...profile.basics.email!,
      value: "not-an-email",
    };
    expect(resumeProfileSchema.safeParse(profile).success).toBe(false);
  });

  it("enforces grounded fact length limits", () => {
    const profile = createProfile();
    profile.summary = fact("x".repeat(601), "user_provided", 14);
    expect(resumeProfileSchema.safeParse(profile).success).toBe(false);
  });

  it("rejects unsupported schema versions", () => {
    const profile = { ...createProfile(), schemaVersion: 2 };
    expect(resumeProfileSchema.safeParse(profile).success).toBe(false);
  });

  it("validates stored JSON before it is treated as a profile", () => {
    const databaseJson: unknown = JSON.parse(JSON.stringify(createProfile()));
    expect(resumeProfileSchema.safeParse(databaseJson).success).toBe(true);

    const corruptedJson: unknown = {
      ...createProfile(),
      basics: { ...createProfile().basics, unknown: "value" },
    };
    expect(resumeProfileSchema.safeParse(corruptedJson).success).toBe(false);
  });
});

describe("resume profile trust utilities", () => {
  it("removes exact duplicate skills case-insensitively without merging distinct skills", () => {
    const profile = createProfile();
    profile.skills[0]?.items.push(fact("react", "user_provided", 15));
    profile.skills[0]?.items.push(fact("React Native", "user_provided", 16));

    const normalized = normalizeResumeProfile(profile);
    expect(normalized.skills[0]?.items.map((item) => item.value)).toEqual([
      "React",
      "React Native",
    ]);
  });

  it("migrates the legacy verified experience group into professional skills", () => {
    const profile = createProfile();
    profile.skills.push({
      id: id(30),
      category: fact("Verified experience", "user_provided", 31),
      items: [fact("PostgreSQL", "user_provided", 32)],
    });

    const normalized = normalizeResumeProfile(profile);

    expect(normalized.skills.map((group) => group.category.value)).toContain(
      "Additional technical skills"
    );
    expect(normalized.skills.map((group) => group.category.value)).not.toContain(
      "Verified experience"
    );
    expect(
      normalized.skills
        .find((group) => group.category.value === "Additional technical skills")
        ?.items.map((skill) => skill.value)
    ).toEqual(["PostgreSQL"]);
  });

  it("collects candidate IDs and paths", () => {
    const profile = createProfile();
    profile.summary = fact("Candidate summary", "candidate", 17);

    expect(collectCandidateFacts(profile)).toEqual([
      { id: id(17), path: "summary" },
    ]);
  });

  it("upgrades legacy CV-grounded candidates to CV-verified facts", () => {
    const profile = createProfile();
    profile.summary = fact("Candidate summary", "candidate", 18);

    const evaluation = evaluateResumeProfile(profile);
    expect(evaluation.isReady).toBe(true);
    expect(evaluation.candidateFactIds).toHaveLength(0);
    expect(evaluation.warnings).toHaveLength(0);
  });

  it("treats CV-verified, confirmed, and user-provided facts as trusted", () => {
    const profile = createProfile();
    profile.summary = fact("Confirmed summary", "confirmed", 19);

    expect(collectTrustedFactIds(profile)).toContain(id(19));
    expect(evaluateResumeProfile(profile).isReady).toBe(true);

    profile.summary = fact("Verified CV summary", "cv_verified", 20);
    expect(collectTrustedFactIds(profile)).toContain(id(20));
    expect(evaluateResumeProfile(profile).isReady).toBe(true);
  });
});
