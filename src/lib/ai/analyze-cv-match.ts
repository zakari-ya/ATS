import "server-only";

import {
  buildCvMatchPrompt,
  buildCvMatchRepairPrompt,
} from "@/lib/ai/prompts";
import {
  AiProviderError,
  requestAiJsonCompletion,
} from "@/lib/ai/client";
import { safeParseAiCvMatchResponse } from "@/lib/ai/safe-ai-output";
import type { AiCvMatchResponse } from "@/types/ai";

type AnalyzeCvMatchInput = {
  jobDescription: string;
  cvText: string;
};

export type AnalyzeCvMatchResult =
  | {
      ok: true;
      aiResponse: AiCvMatchResponse;
      model: string;
    }
  | {
      ok: false;
      errorCode:
        | "AI_PROVIDER_NOT_CONFIGURED"
        | "RATE_LIMITED"
        | "AI_PROVIDER_AUTH_FAILED"
        | "AI_MODEL_NOT_FOUND"
        | "AI_REQUEST_FORMAT_INVALID"
        | "AI_REQUEST_FAILED"
        | "AI_JSON_INVALID"
        | "AI_ANALYSIS_FAILED";
      message: string;
    };

const MAX_ATTEMPTS = 2;

export async function analyzeCvMatchWithAi({
  jobDescription,
  cvText,
}: AnalyzeCvMatchInput): Promise<AnalyzeCvMatchResult> {
  const prompt = buildCvMatchPrompt({ jobDescription, cvText });
  let nextPrompt = prompt;
  let lastSafeError: AnalyzeCvMatchResult | null = null;

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
    try {
      const completion = await requestAiJsonCompletion({ prompt: nextPrompt });
      const parsed = safeParseAiCvMatchResponse(completion.content);

      if (parsed.ok) {
        return {
          ok: true,
          aiResponse: parsed.data,
          model: completion.model,
        };
      }

      lastSafeError = {
        ok: false,
        errorCode: "AI_JSON_INVALID",
        message:
          "We could not validate the AI analysis safely. Please try again.",
      };

      if (attempt < MAX_ATTEMPTS) {
        nextPrompt = buildCvMatchRepairPrompt({
          jobDescription,
          cvText,
          invalidJson: completion.content,
          validationIssues: parsed.issues,
        });
      }
    } catch (error) {
      if (error instanceof AiProviderError) {
        const safeError: AnalyzeCvMatchResult = {
          ok: false,
          errorCode: error.errorCode,
          message:
            error.errorCode === "AI_PROVIDER_NOT_CONFIGURED"
              ? "The analysis service is not configured yet."
              : error.errorCode === "RATE_LIMITED"
                ? error.message
              : error.errorCode === "AI_PROVIDER_AUTH_FAILED"
                ? error.message
              : error.errorCode === "AI_MODEL_NOT_FOUND"
                ? error.message
              : error.errorCode === "AI_REQUEST_FORMAT_INVALID"
                ? error.message
              : "The analysis failed. Please try again.",
        };

        if (!error.retryable) {
          return safeError;
        }

        lastSafeError = safeError;
      } else {
        lastSafeError = {
          ok: false,
          errorCode: "AI_ANALYSIS_FAILED",
          message: "The analysis failed. Please try again.",
        };
      }
    }
  }

  return (
    lastSafeError ?? {
      ok: false,
      errorCode: "AI_ANALYSIS_FAILED",
      message: "The analysis failed. Please try again.",
    }
  );
}
