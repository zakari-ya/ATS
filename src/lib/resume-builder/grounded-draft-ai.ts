import "server-only";

import {
  isAiProviderError,
  requestAiJsonCompletion,
  type AiProviderErrorCode,
} from "@/lib/ai/client";
import {
  resumeDraftResponseJsonSchema,
  resumeDraftSchema,
  type ResumeDraft,
} from "@/lib/resume-builder/resume-draft-schema";
import type { ResumeReadyProfile } from "@/lib/resume-builder/resume-profile-utils";
import { validateGroundedResumeDraft } from "@/lib/resume-builder/validate-resume-draft";

export type GroundedDraftAiResult =
  | { ok: true; data: { draft: ResumeDraft; model: string } }
  | {
      ok: false;
      errorCode:
        | AiProviderErrorCode
        | "AI_JSON_INVALID"
        | "RESUME_DRAFT_INVALID";
    };

const RESUME_DRAFT_TIMEOUT_MS = 180_000;
const RESUME_DRAFT_TOTAL_BUDGET_MS = 240_000;
const MAX_DRAFT_ATTEMPTS = 2;

export async function requestGroundedResumeDraft({
  prompt,
  profile,
}: {
  prompt: string;
  profile: ResumeReadyProfile;
}, dependencies: {
  requestCompletion?: typeof requestAiJsonCompletion;
} = {}): Promise<GroundedDraftAiResult> {
  const requestCompletion =
    dependencies.requestCompletion ?? requestAiJsonCompletion;
  const startedAt = Date.now();

  for (let attempt = 1; attempt <= MAX_DRAFT_ATTEMPTS; attempt += 1) {
    const remainingBudget =
      RESUME_DRAFT_TOTAL_BUDGET_MS - (Date.now() - startedAt);
    if (remainingBudget < 1_000) {
      return { ok: false, errorCode: "AI_REQUEST_TIMEOUT" };
    }

    let completion;
    try {
      completion = await requestCompletion({
        prompt,
        timeoutMs: Math.min(RESUME_DRAFT_TIMEOUT_MS, remainingBudget),
        responseSchema: {
          name: "grounded_resume_draft",
          schema: resumeDraftResponseJsonSchema,
        },
      });
    } catch (error) {
      if (!isAiProviderError(error)) {
        return { ok: false, errorCode: "AI_REQUEST_FAILED" };
      }

      const canRetry =
        error.retryable &&
        error.errorCode !== "AI_REQUEST_TIMEOUT" &&
        attempt < MAX_DRAFT_ATTEMPTS;
      if (canRetry) continue;
      return { ok: false, errorCode: error.errorCode };
    }

    let unknownDraft: unknown = completion.content;
    try {
      if (typeof unknownDraft === "string") {
        unknownDraft = JSON.parse(unknownDraft) as unknown;
      }
    } catch {
      if (attempt < MAX_DRAFT_ATTEMPTS) continue;
      return { ok: false, errorCode: "AI_JSON_INVALID" };
    }

    const draft = resumeDraftSchema.safeParse(unknownDraft);
    if (!draft.success) {
      if (attempt < MAX_DRAFT_ATTEMPTS) continue;
      return { ok: false, errorCode: "AI_JSON_INVALID" };
    }
    if (!validateGroundedResumeDraft(profile, draft.data).valid) {
      if (attempt < MAX_DRAFT_ATTEMPTS) continue;
      return { ok: false, errorCode: "RESUME_DRAFT_INVALID" };
    }

    return { ok: true, data: { draft: draft.data, model: completion.model } };
  }

  return { ok: false, errorCode: "AI_REQUEST_FAILED" };
}
