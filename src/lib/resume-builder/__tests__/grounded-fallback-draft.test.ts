import { describe, expect, it } from "vitest";

import { buildGroundedFallbackDraft } from "@/lib/resume-builder/build-grounded-fallback-draft";
import { fictionalResumeReadyProfileFixture } from "@/lib/resume-builder/resume-profile-fixture";
import { createResumeReadyProfile } from "@/lib/resume-builder/resume-profile-utils";
import { validateGroundedResumeDraft } from "@/lib/resume-builder/validate-resume-draft";
import type { AiCvMatchResponse } from "@/types/ai";

const analysis = {
  match_matrix: [
    {
      requirement: "React",
      match_status: "exact_match",
    },
  ],
} as AiCvMatchResponse;

describe("grounded fallback resume draft", () => {
  it("creates a valid draft using only trusted profile facts", () => {
    const draft = buildGroundedFallbackDraft({
      profile: fictionalResumeReadyProfileFixture,
      aiAnalysis: analysis,
    });

    expect(
      validateGroundedResumeDraft(fictionalResumeReadyProfileFixture, draft)
        .valid
    ).toBe(true);
    expect(draft.summarySentences[0]?.text).toBe(
      fictionalResumeReadyProfileFixture.summary?.value
    );
    expect(draft.warnings[0]).toContain("AI tailoring was unavailable");
  });

  it("orders exactly matched skills before other trusted skills", () => {
    const draft = buildGroundedFallbackDraft({
      profile: fictionalResumeReadyProfileFixture,
      aiAnalysis: analysis,
    });
    const react = fictionalResumeReadyProfileFixture.skills
      .flatMap((group) => group.items)
      .find((skill) => skill.value === "React");

    expect(draft.selectedSkillIds[0]).toBe(react?.id);
  });

  it("splits long trusted summaries and bullets within the draft limit", () => {
    const profile = structuredClone(fictionalResumeReadyProfileFixture);
    const longSummary = Array.from(
      { length: 24 },
      (_, index) => `Verified summary sentence ${index + 1}.`
    ).join(" ");
    const longBullet = Array.from(
      { length: 22 },
      (_, index) => `Completed verified task ${index + 1}.`
    ).join(" ");
    profile.summary!.value = longSummary.slice(0, 600);
    profile.experience[0]!.bullets![0]!.value = longBullet.slice(0, 600);

    const ready = createResumeReadyProfile(profile);
    expect(ready.ok).toBe(true);
    if (!ready.ok) return;

    const draft = buildGroundedFallbackDraft({
      profile: ready.data,
      aiAnalysis: analysis,
    });

    const generatedText = [
      ...draft.summarySentences,
      ...draft.experience.flatMap((entry) => entry.bullets),
    ];
    expect(generatedText.every((item) => item.text.length <= 420)).toBe(true);
    expect(validateGroundedResumeDraft(ready.data, draft).valid).toBe(true);
  });

  it("deduplicates repeated legacy profile IDs", () => {
    const profile = structuredClone(fictionalResumeReadyProfileFixture);
    profile.skills[0]!.items.push(profile.skills[0]!.items[0]!);
    profile.education.push(profile.education[0]!);

    const ready = createResumeReadyProfile(profile);
    expect(ready.ok).toBe(true);
    if (!ready.ok) return;

    const draft = buildGroundedFallbackDraft({
      profile: ready.data,
      aiAnalysis: analysis,
    });

    expect(new Set(draft.selectedSkillIds).size).toBe(
      draft.selectedSkillIds.length
    );
    expect(new Set(draft.selectedEducationEntryIds).size).toBe(
      draft.selectedEducationEntryIds.length
    );
    expect(validateGroundedResumeDraft(ready.data, draft).valid).toBe(true);
  });
});
