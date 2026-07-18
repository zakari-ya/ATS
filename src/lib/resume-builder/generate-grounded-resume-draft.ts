import "server-only";

import { safeParseAiCvMatchResponse } from "@/lib/ai/safe-ai-output";
import { buildTailoringInput } from "@/lib/resume-builder/build-tailoring-input";
import { buildGroundedFallbackDraft } from "@/lib/resume-builder/build-grounded-fallback-draft";
import { upsertResumeDraftForScan } from "@/lib/resume-builder/resume-draft-repository";
import { createResumeReadyProfile } from "@/lib/resume-builder/resume-profile-utils";
import type { ResumeReadyProfile } from "@/lib/resume-builder/resume-profile-utils";
import { buildResumeTailoringPrompt } from "@/lib/resume-builder/resume-tailoring-prompt";
import { requestGroundedResumeDraft } from "@/lib/resume-builder/grounded-draft-ai";
import { checkUsageActionLimit, consumeUsageAction } from "@/lib/security/usage-limits";
import { createClient } from "@/lib/supabase/server";
import type { AiCvMatchResponse } from "@/types/ai";
import { resumeLanguageSchema, type ResumeLanguage } from "@/lib/resume-builder/resume-language";

const activeGenerations = new Set<string>();

type ScanRow = { id: string; user_id: string; current_status: string };
type ScanResultRow = {
  job_description: string;
  ai_json: unknown;
  ai_validation_status: string;
  applied_caps: unknown;
};
type ResumeProfileRow = {
  id: string;
  profile_data: unknown;
  user_id: string;
  source_scan_id: string;
  resume_language: string;
};

export type GenerateGroundedResumeDraftResult =
  | { ok: true; data: { draftId: string; scanId: string; model: string; warnings: string[] } }
  | { ok: false; error: { code: ResumeGenerationErrorCode; message: string } };

export type ResumeGenerationErrorCode =
  | "UNAUTHORIZED"
  | "INVALID_SCAN_ID"
  | "SCAN_NOT_FOUND"
  | "SCAN_NOT_COMPLETED"
  | "SCAN_RESULT_NOT_READY"
  | "RESUME_PROFILE_NOT_FOUND"
  | "RESUME_PROFILE_NOT_READY"
  | "RESUME_GENERATION_IN_PROGRESS"
  | "DAILY_AI_LIMIT_REACHED"
  | "USAGE_COUNTER_FAILED"
  | "AI_PROVIDER_NOT_CONFIGURED"
  | "AI_REQUEST_FAILED"
  | "AI_JSON_INVALID"
  | "RESUME_DRAFT_INVALID"
  | "DATABASE_WRITE_FAILED";

export async function generateGroundedResumeDraftForScan(
  scanId: string
): Promise<GenerateGroundedResumeDraftResult> {
  if (!isUuid(scanId)) return failure("INVALID_SCAN_ID");
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return failure("UNAUTHORIZED");

  const generationKey = `${user.id}:${scanId}`;
  if (activeGenerations.has(generationKey)) return failure("RESUME_GENERATION_IN_PROGRESS");
  activeGenerations.add(generationKey);

  try {
    const context = await loadGenerationContext({ supabase, userId: user.id, scanId });
    if (!context.ok) return context;

    const prompt = buildResumeTailoringPrompt(
      buildTailoringInput({
        profile: context.data.profile,
        jobDescription: context.data.scanResult.job_description,
        aiAnalysis: context.data.aiAnalysis,
        scoreLimitReasons: context.data.scoreLimitReasons,
        resumeLanguage: context.data.resumeLanguage,
      })
    );

    const aiLimit = await checkUsageActionLimit({
      userId: user.id,
      action: "resume_generation",
    });
    if (!aiLimit.ok && aiLimit.errorCode !== "DAILY_AI_LIMIT_REACHED") {
      return failure("USAGE_COUNTER_FAILED");
    }

    let generated: Awaited<ReturnType<typeof requestGroundedResumeDraft>> | null =
      null;
    if (aiLimit.ok) {
      // Consume only after every local validation has passed and immediately
      // before the provider call. A quota-limited user receives the grounded
      // fallback without another provider request.
      const usage = await consumeUsageAction({
        userId: user.id,
        action: "resume_generation",
      });
      if (!usage.ok) {
        return failure("USAGE_COUNTER_FAILED");
      }
      generated = await requestGroundedResumeDraft({
        prompt,
        profile: context.data.profile,
      });
    }

    let draft;
    if (generated?.ok) {
      draft = generated.data.draft;
    } else {
      try {
        draft = buildGroundedFallbackDraft({
          profile: context.data.profile,
          aiAnalysis: context.data.aiAnalysis,
        });
      } catch {
        return failure("RESUME_DRAFT_INVALID");
      }
    }
    const model = generated?.ok ? generated.data.model : "grounded-fallback";

    const saved = await upsertResumeDraftForScan(scanId, {
      ...draft,
    });
    if (!saved.ok) return failure(mapRepositoryError(saved.error.code));

    return {
      ok: true,
      data: {
        draftId: saved.data.id,
        scanId,
        model,
        warnings: saved.data.validationWarnings,
      },
    };
  } finally {
    activeGenerations.delete(generationKey);
  }
}

async function loadGenerationContext({
  supabase,
  userId,
  scanId,
}: {
  supabase: Awaited<ReturnType<typeof createClient>>;
  userId: string;
  scanId: string;
}): Promise<
  | {
      ok: true;
      data: {
        profile: ResumeReadyProfile;
        aiAnalysis: AiCvMatchResponse;
        scanResult: ScanResultRow;
        scoreLimitReasons: string[];
        resumeLanguage: ResumeLanguage;
      };
    }
  | { ok: false; error: { code: ResumeGenerationErrorCode; message: string } }
> {
  const { data: scan, error: scanError } = await supabase
    .from("scans")
    .select("id, user_id, current_status")
    .eq("id", scanId)
    .eq("user_id", userId)
    .maybeSingle<ScanRow>();
  if (scanError || !scan || scan.user_id !== userId) return contextFailure("SCAN_NOT_FOUND");
  if (scan.current_status !== "completed") return contextFailure("SCAN_NOT_COMPLETED");

  const { data: scanResult, error: resultError } = await supabase
    .from("scan_results")
    .select("job_description, ai_json, ai_validation_status, applied_caps")
    .eq("scan_id", scanId)
    .eq("user_id", userId)
    .maybeSingle<ScanResultRow>();
  if (resultError || !scanResult || scanResult.ai_validation_status !== "valid") return contextFailure("SCAN_RESULT_NOT_READY");

  const aiAnalysis = safeParseAiCvMatchResponse(scanResult.ai_json);
  if (!aiAnalysis.ok) return contextFailure("SCAN_RESULT_NOT_READY");

  const { data: storedProfile, error: profileError } = await supabase
    .from("resume_profiles")
    .select("id, profile_data, user_id, source_scan_id, resume_language")
    .eq("user_id", userId)
    .eq("source_scan_id", scanId)
    .maybeSingle<ResumeProfileRow>();
  if (profileError) return contextFailure("DATABASE_WRITE_FAILED");
  if (!storedProfile || storedProfile.user_id !== userId || storedProfile.source_scan_id !== scanId) {
    return contextFailure("RESUME_PROFILE_NOT_FOUND");
  }
  const profile = createResumeReadyProfile(storedProfile.profile_data);
  if (!profile.ok) return contextFailure("RESUME_PROFILE_NOT_READY");
  if (profile.data.id !== storedProfile.id || profile.data.sourceScanId !== scanId) {
    return contextFailure("RESUME_PROFILE_NOT_READY");
  }

  const resumeLanguage = resumeLanguageSchema.safeParse(storedProfile.resume_language);
  if (!resumeLanguage.success) return contextFailure("RESUME_PROFILE_NOT_READY");

  return {
    ok: true,
    data: {
      profile: profile.data,
      aiAnalysis: aiAnalysis.data,
      scanResult,
      scoreLimitReasons: readCapReasons(scanResult.applied_caps),
      resumeLanguage: resumeLanguage.data,
    },
  };
}

function readCapReasons(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item) =>
    typeof item === "object" && item !== null && "reason" in item && typeof item.reason === "string"
      ? [item.reason]
      : []
  ).slice(0, 8);
}

function mapRepositoryError(code: string): ResumeGenerationErrorCode {
  if (code === "RESUME_PROFILE_NOT_FOUND") return "RESUME_PROFILE_NOT_FOUND";
  if (code === "RESUME_PROFILE_NOT_READY") return "RESUME_PROFILE_NOT_READY";
  if (code === "INVALID_RESUME_DRAFT" || code === "RESUME_DRAFT_INVALID") return "RESUME_DRAFT_INVALID";
  return "DATABASE_WRITE_FAILED";
}

function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

function failure(code: ResumeGenerationErrorCode): GenerateGroundedResumeDraftResult {
  const messages: Record<ResumeGenerationErrorCode, string> = {
    UNAUTHORIZED: "You need to sign in again.",
    INVALID_SCAN_ID: "We could not find this scan.",
    SCAN_NOT_FOUND: "We could not find this completed scan.",
    SCAN_NOT_COMPLETED: "This scan is not ready to use for a tailored resume.",
    SCAN_RESULT_NOT_READY: "The completed scan result is not ready to use.",
    RESUME_PROFILE_NOT_FOUND: "We could not find a resume profile for this scan.",
    RESUME_PROFILE_NOT_READY: "The resume profile needs trusted facts before it can be used.",
    RESUME_GENERATION_IN_PROGRESS: "A tailored resume draft is already being prepared.",
    DAILY_AI_LIMIT_REACHED: "You reached your daily analysis limit. Please try again tomorrow.",
    USAGE_COUNTER_FAILED: "We could not verify your daily usage. Please try again.",
    AI_PROVIDER_NOT_CONFIGURED: "The analysis service is not configured yet.",
    AI_REQUEST_FAILED: "The tailored resume could not be generated. Please try again.",
    AI_JSON_INVALID: "We could not validate the tailored resume safely. Please try again.",
    RESUME_DRAFT_INVALID: "The tailored resume could not be validated safely.",
    DATABASE_WRITE_FAILED: "The tailored resume draft could not be saved. Please try again.",
  };
  return { ok: false, error: { code, message: messages[code] } };
}

function contextFailure(code: ResumeGenerationErrorCode): {
  ok: false;
  error: { code: ResumeGenerationErrorCode; message: string };
} {
  const result = failure(code);
  if (result.ok) throw new Error("Unexpected resume generation success result.");
  return result;
}
