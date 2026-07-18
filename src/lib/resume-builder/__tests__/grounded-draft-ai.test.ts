import { describe, expect, it, vi } from "vitest";

import { fictionalResumeReadyProfileFixture } from "@/lib/resume-builder/resume-profile-fixture";
import { requestGroundedResumeDraft } from "@/lib/resume-builder/grounded-draft-ai";

function id(index: number): string {
  return `10000000-0000-4000-8000-${String(index).padStart(12, "0")}`;
}

function response() {
  return {
    schemaVersion: 1,
    summarySentences: [{ id: id(60), text: "Builds accessible web interfaces with dependable APIs.", sourceFactIds: [id(9)] }],
    selectedSkillIds: [id(12)],
    experience: [],
    projects: [],
    selectedEducationEntryIds: [],
    selectedCertificationEntryIds: [],
    selectedLanguageEntryIds: [],
    sectionOrder: ["summary", "skills"],
    warnings: [],
  };
}

describe("grounded resume draft AI adapter", () => {
  it("uses the existing provider client and accepts a grounded response", async () => {
    const requestAiJsonCompletionMock = vi.fn();
    requestAiJsonCompletionMock.mockResolvedValue({ content: JSON.stringify(response()), model: "test-model" });
    const result = await requestGroundedResumeDraft(
      { prompt: "trusted prompt", profile: fictionalResumeReadyProfileFixture },
      { requestCompletion: requestAiJsonCompletionMock }
    );
    expect(result).toMatchObject({ ok: true, data: { model: "test-model" } });
    expect(requestAiJsonCompletionMock).toHaveBeenCalledWith(expect.objectContaining({
      prompt: "trusted prompt",
      timeoutMs: 180_000,
      responseSchema: expect.objectContaining({ name: "grounded_resume_draft" }),
    }));
  });

  it("fails safely for malformed or ungrounded provider output", async () => {
    const malformedRequest = vi.fn().mockResolvedValue({
      content: "not json",
      model: "test-model",
    });
    await expect(requestGroundedResumeDraft(
      { prompt: "trusted prompt", profile: fictionalResumeReadyProfileFixture },
      { requestCompletion: malformedRequest }
    ))
      .resolves.toEqual({ ok: false, errorCode: "AI_JSON_INVALID" });
    expect(malformedRequest).toHaveBeenCalledTimes(2);

    const invalid = response();
    invalid.summarySentences[0]!.sourceFactIds = [id(999)];
    const ungroundedRequest = vi.fn().mockResolvedValue({
      content: JSON.stringify(invalid),
      model: "test-model",
    });
    await expect(requestGroundedResumeDraft(
      { prompt: "trusted prompt", profile: fictionalResumeReadyProfileFixture },
      { requestCompletion: ungroundedRequest }
    ))
      .resolves.toEqual({ ok: false, errorCode: "RESUME_DRAFT_INVALID" });
    expect(ungroundedRequest).toHaveBeenCalledTimes(2);
  });
});
