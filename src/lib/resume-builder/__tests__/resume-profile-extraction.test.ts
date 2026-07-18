import { describe, expect, it } from "vitest";

import {
  buildCandidateResumeProfile,
  parseResumeProfileExtraction,
} from "@/lib/resume-builder/resume-profile-extraction";
import { collectCandidateFacts, createResumeReadyProfile } from "@/lib/resume-builder/resume-profile-utils";

const scanId = "10000000-0000-4000-8000-000000000001";
const cvText = [
  "Avery Morgan",
  "Frontend Developer",
  "avery@example.test",
  "Skills: React, TypeScript",
  "Project: Volunteer Connect",
  "Built accessible React interfaces.",
].join("\n");

const extraction = {
  schemaVersion: 1,
  facts: [
    fact("basics.fullName", 0, "Avery Morgan", "Avery Morgan"),
    fact("basics.professionalTitle", 0, "Frontend Developer", "Frontend Developer"),
    fact("basics.email", 0, "avery@example.test", "avery@example.test"),
    fact("skills.item", 0, "React", "Skills: React, TypeScript"),
    fact("skills.item", 0, "TypeScript", "Skills: React, TypeScript"),
    fact("projects.name", 0, "Volunteer Connect", "Project: Volunteer Connect"),
    fact("projects.technology", 0, "React", "Built accessible React interfaces."),
    fact(
      "projects.bullet",
      0,
      "Built accessible React interfaces.",
      "Built accessible React interfaces."
    ),
  ],
};

describe("resume profile extraction boundary", () => {
  it("lets the backend assign CV-verified trust metadata and stable UUIDs", () => {
    const parsed = parseResumeProfileExtraction(extraction);
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;

    const built = buildCandidateResumeProfile({
      scanId,
      cvText,
      extraction: parsed.data,
    });

    expect(built.ok).toBe(true);
    if (!built.ok) return;
    expect(built.data.sourceScanId).toBe(scanId);
    expect(built.data.basics.fullName?.verificationStatus).toBe("cv_verified");
    expect(built.data.basics.fullName?.sources[0]).toMatchObject({
      kind: "cv_text",
      scanId,
      excerpt: "Avery Morgan",
    });
    expect(collectCandidateFacts(built.data)).toHaveLength(0);
    expect(createResumeReadyProfile(built.data).ok).toBe(true);
  });

  it("omits ungrounded facts instead of trusting or failing the whole profile", () => {
    const parsed = parseResumeProfileExtraction({
      ...extraction,
      facts: [
        ...extraction.facts,
        fact("skills.item", 0, "PostgreSQL", "Expert PostgreSQL developer"),
      ],
    });
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;

    const built = buildCandidateResumeProfile({
      scanId,
      cvText,
      extraction: parsed.data,
    });
    expect(built.ok).toBe(true);
    if (!built.ok) return;
    expect(built.data.skills.flatMap((group) => group.items.map((item) => item.value))).not.toContain("PostgreSQL");
  });

  it("rejects unexpected provider fields", () => {
    expect(
      parseResumeProfileExtraction({ ...extraction, verificationStatus: "confirmed" }).ok
    ).toBe(false);
  });

  it("accepts harmless PDF punctuation normalization", () => {
    const textWithPdfPunctuation = `${cvText}\n2024 – Present`;
    const parsed = parseResumeProfileExtraction({
      ...extraction,
      facts: [
        ...extraction.facts,
        fact("experience.dateLabel", 0, "2024 - Present", "2024 - Present"),
      ],
    });
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;

    expect(
      buildCandidateResumeProfile({
        scanId,
        cvText: textWithPdfPunctuation,
        extraction: parsed.data,
      }).ok
    ).toBe(true);
  });

  it("normalizes a grounded LinkedIn URL without a scheme", () => {
    const linkedIn = "linkedin.com/in/avery-morgan";
    const parsed = parseResumeProfileExtraction({
      ...extraction,
      facts: [
        ...extraction.facts,
        fact("basics.linkedin", 0, linkedIn, linkedIn),
      ],
    });

    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;
    expect(parsed.data.basics.linkedin?.value).toBe(`https://${linkedIn}`);

    const built = buildCandidateResumeProfile({
      scanId,
      cvText: `${cvText}\n${linkedIn}`,
      extraction: parsed.data,
    });
    expect(built.ok).toBe(true);
    if (!built.ok) return;
    expect(built.data.basics.linkedin?.value).toBe(`https://${linkedIn}`);
  });

  it("omits malformed and unsafe URLs without throwing", () => {
    expect(() =>
      parseResumeProfileExtraction({
        ...extraction,
        facts: [
          ...extraction.facts,
          fact("basics.linkedin", 0, "not a url", "not a url"),
          fact(
            "basics.portfolio",
            0,
            "javascript:alert(1)",
            "javascript:alert(1)"
          ),
        ],
      })
    ).not.toThrow();

    const parsed = parseResumeProfileExtraction({
      ...extraction,
      facts: [
        ...extraction.facts,
        fact("basics.linkedin", 0, "not a url", "not a url"),
      ],
    });
    expect(parsed.ok).toBe(true);
    if (parsed.ok) expect(parsed.data.basics.linkedin).toBeNull();
  });
});

function fact(
  section: string,
  entryIndex: number,
  value: string,
  excerpt: string
) {
  return { section, entryIndex, value, excerpt };
}
