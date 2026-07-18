import { beforeEach, describe, expect, it, vi } from "vitest";

import { AiProviderError } from "@/lib/ai/client";
import { extractResumeProfileWithAi } from "@/lib/resume-builder/resume-profile-extraction-ai";
import { resumeProfileExtractionJsonSchema } from "@/lib/resume-builder/resume-profile-extraction";

const scanId = "10000000-0000-4000-8000-000000000001";
const cvText = "Avery Morgan\nFrontend Developer\navery@example.com";
const validOutput = JSON.stringify({
  schemaVersion: 1,
  facts: [
    {
      section: "basics.fullName",
      entryIndex: 0,
      value: "Avery Morgan",
      excerpt: "Avery Morgan",
    },
  ],
});
const requestAiJsonCompletionMock = vi.fn();

beforeEach(() => requestAiJsonCompletionMock.mockReset());

const extract = () =>
  extractResumeProfileWithAi(
    { scanId, cvText },
    { requestCompletion: requestAiJsonCompletionMock }
  );

describe("resume profile AI extraction", () => {
  it("keeps the backend fact limit out of provider schema metadata", () => {
    expect(
      resumeProfileExtractionJsonSchema.properties.facts
    ).not.toHaveProperty("maxItems");
  });

  it("uses the longer extraction timeout and returns CV-verified facts", async () => {
    requestAiJsonCompletionMock.mockResolvedValue({
      content: validOutput,
      model: "fictional-model",
    });

    const result = await extract();

    expect(result.ok).toBe(true);
    expect(requestAiJsonCompletionMock).toHaveBeenCalledWith(
      expect.objectContaining({ timeoutMs: 180_000 })
    );
    if (result.ok) {
      expect(result.data.profile.basics.fullName?.verificationStatus).toBe(
        "cv_verified"
      );
    }
  });

  it("retries one temporary provider failure", async () => {
    requestAiJsonCompletionMock
      .mockRejectedValueOnce(
        new AiProviderError({
          errorCode: "AI_REQUEST_FAILED",
          message: "Temporary failure",
          retryable: true,
          providerStatus: 503,
        })
      )
      .mockResolvedValueOnce({ content: validOutput, model: "fictional-model" });

    const result = await extract();

    expect(result.ok).toBe(true);
    expect(requestAiJsonCompletionMock).toHaveBeenCalledTimes(2);
  });

  it("retries malformed JSON once and then validates the second response", async () => {
    requestAiJsonCompletionMock
      .mockResolvedValueOnce({ content: "not json", model: "fictional-model" })
      .mockResolvedValueOnce({ content: validOutput, model: "fictional-model" });

    const result = await extract();

    expect(result.ok).toBe(true);
    expect(requestAiJsonCompletionMock).toHaveBeenCalledTimes(2);
  });

  it("does not retry a full extraction timeout", async () => {
    let calls = 0;
    const requestCompletion = async () => {
      calls += 1;
      throw {
        name: "AiProviderError",
        errorCode: "AI_REQUEST_TIMEOUT",
        message: "Timed out",
        retryable: true,
      };
    };

    const result = await extractResumeProfileWithAi(
      { scanId, cvText },
      { requestCompletion }
    );

    expect(result).toEqual({
      ok: false,
      error: {
        code: "AI_REQUEST_TIMEOUT",
        message: "Preparing your CV information took too long. Please try again.",
      },
    });
    expect(calls).toBe(1);
  });

  it("does not retry permanent provider errors", async () => {
    let calls = 0;
    const requestCompletion = async () => {
      calls += 1;
      throw {
        name: "AiProviderError",
        errorCode: "AI_PROVIDER_AUTH_FAILED",
        message: "Rejected",
        retryable: false,
      };
    };

    const result = await extractResumeProfileWithAi(
      { scanId, cvText },
      { requestCompletion }
    );

    expect(result.ok).toBe(false);
    expect(calls).toBe(1);
  });
});
