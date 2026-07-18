import { describe, expect, it } from "vitest";

import { getResumePdfCopy } from "@/lib/resume-builder/resume-pdf-copy";
import {
  detectResumeLanguage,
  resumeLanguageSettingsSchema,
} from "@/lib/resume-builder/resume-language";
import {
  buildResumePdfData,
} from "@/lib/resume-builder/resume-pdf-data";
import { fictionalResumeReadyProfileFixture } from "@/lib/resume-builder/resume-profile-fixture";

describe("resume language", () => {
  it("detects French from common CV section vocabulary", () => {
    expect(
      detectResumeLanguage(
        "Expérience professionnelle\nCompétences\nFormation\nProjets\nLangues"
      )
    ).toBe("fr");
  });

  it("detects English and defaults safely when the text is ambiguous", () => {
    expect(
      detectResumeLanguage(
        "Professional Experience\nSkills\nEducation\nProjects\nLanguages"
      )
    ).toBe("en");
    expect(detectResumeLanguage("React TypeScript 2026")).toBe("en");
  });

  it("accepts only the supported language settings", () => {
    expect(
      resumeLanguageSettingsSchema.safeParse({
        language: "fr",
        source: "user_selected",
      }).success
    ).toBe(true);
    expect(
      resumeLanguageSettingsSchema.safeParse({
        language: "ar",
        source: "user_selected",
      }).success
    ).toBe(false);
  });

  it("maps the fixed PDF labels and link labels into French", () => {
    const data = buildResumePdfData(
      fictionalResumeReadyProfileFixture,
      undefined,
      "fr"
    );

    expect(data.language).toBe("fr");
    expect(data.projects[0]?.links).toContainEqual({
      label: "Dépôt",
      href: "https://github.com/avery-morgan/volunteer-connect",
    });
    expect(getResumePdfCopy("fr")).toMatchObject({
      summary: "Profil professionnel",
      experience: "Expérience professionnelle",
      education: "Formation",
    });
  });
});
