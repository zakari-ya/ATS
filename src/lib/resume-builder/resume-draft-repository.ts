import "server-only";

import { createClient } from "@/lib/supabase/server";
import { resumeDraftSchema, type ResumeDraft } from "@/lib/resume-builder/resume-draft-schema";
import { createResumeReadyProfile } from "@/lib/resume-builder/resume-profile-utils";
import type { ResumeReadyProfile } from "@/lib/resume-builder/resume-profile-utils";
import { validateGroundedResumeDraft } from "@/lib/resume-builder/validate-resume-draft";
import { resumeLanguageSchema, type ResumeLanguage } from "@/lib/resume-builder/resume-language";

export type ResumeDraftRepositoryErrorCode =
  | "UNAUTHORIZED"
  | "INVALID_SCAN_ID"
  | "SCAN_NOT_FOUND"
  | "SCAN_NOT_COMPLETED"
  | "RESUME_PROFILE_NOT_FOUND"
  | "RESUME_PROFILE_NOT_READY"
  | "INVALID_RESUME_DRAFT"
  | "RESUME_DRAFT_INVALID"
  | "DATABASE_WRITE_FAILED"
  | "DATABASE_DELETE_FAILED";

export type ResumeDraftRepositoryResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: { code: ResumeDraftRepositoryErrorCode; message: string } };

export type StoredResumeDraft = {
  id: string;
  sourceScanId: string;
  resumeProfileId: string;
  schemaVersion: number;
  promptVersion: number;
  resumeLanguage: ResumeLanguage;
  draft: ResumeDraft;
  validationWarnings: string[];
  createdAt: string;
  updatedAt: string;
};

type ScanRow = { id: string; user_id: string; current_status: string };
type ResumeProfileRow = {
  id: string;
  user_id: string;
  source_scan_id: string;
  profile_data: unknown;
  resume_language: string;
};
type ResumeDraftRow = {
  id: string;
  user_id: string;
  source_scan_id: string;
  resume_profile_id: string;
  schema_version: number;
  prompt_version: number;
  resume_language: string;
  draft_data: unknown;
  validation_warnings: unknown;
  created_at: string;
  updated_at: string;
};

export async function getResumeDraftForScan(
  scanId: string
): Promise<ResumeDraftRepositoryResult<StoredResumeDraft | null>> {
  const context = await getContext(scanId);
  if (!context.ok) return context;
  const { supabase, userId, scanId: safeScanId } = context.data;

  const { data, error } = await supabase
    .from("resume_drafts")
    .select("id, user_id, source_scan_id, resume_profile_id, schema_version, prompt_version, resume_language, draft_data, validation_warnings, created_at, updated_at")
    .eq("user_id", userId)
    .eq("source_scan_id", safeScanId)
    .maybeSingle<ResumeDraftRow>();

  if (error) return failure("DATABASE_WRITE_FAILED");
  if (!data) return { ok: true, data: null };
  const profile = await getReadyProfile(context.data);
  if (!profile.ok) return profile;
  return parseStoredDraft(data, context.data, profile.data);
}

export async function upsertResumeDraftForScan(
  scanId: string,
  draftData: unknown
): Promise<ResumeDraftRepositoryResult<StoredResumeDraft>> {
  const context = await getContext(scanId);
  if (!context.ok) return context;

  const draft = resumeDraftSchema.safeParse(draftData);
  if (!draft.success) return failure("INVALID_RESUME_DRAFT");

  const profile = await getReadyProfile(context.data);
  if (!profile.ok) return profile;
  const grounding = validateGroundedResumeDraft(profile.data.profile, draft.data);
  if (!grounding.valid) return failure("INVALID_RESUME_DRAFT");

  const { supabase, userId, scanId: safeScanId } = context.data;
  const { data, error } = await supabase
    .from("resume_drafts")
    .upsert(
      {
        user_id: userId,
        source_scan_id: safeScanId,
        resume_profile_id: profile.data.id,
        schema_version: draft.data.schemaVersion,
        prompt_version: 1,
        resume_language: profile.data.resumeLanguage,
        draft_data: draft.data,
        validation_warnings: grounding.warnings,
      },
      { onConflict: "user_id,source_scan_id" }
    )
    .select("id, user_id, source_scan_id, resume_profile_id, schema_version, prompt_version, resume_language, draft_data, validation_warnings, created_at, updated_at")
    .single<ResumeDraftRow>();

  if (error || !data) return failure("DATABASE_WRITE_FAILED");
  return parseStoredDraft(data, context.data, profile.data);
}

export async function deleteResumeDraftForScan(
  scanId: string
): Promise<ResumeDraftRepositoryResult<{ deleted: true }>> {
  const context = await getContext(scanId);
  if (!context.ok) return context;

  const { error } = await context.data.supabase
    .from("resume_drafts")
    .delete()
    .eq("user_id", context.data.userId)
    .eq("source_scan_id", context.data.scanId);

  if (error) return failure("DATABASE_DELETE_FAILED");
  return { ok: true, data: { deleted: true } };
}

async function getContext(scanId: string): Promise<ResumeDraftRepositoryResult<{
  supabase: Awaited<ReturnType<typeof createClient>>;
  userId: string;
  scanId: string;
}>> {
  if (!isUuid(scanId)) return failure("INVALID_SCAN_ID");
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return failure("UNAUTHORIZED");

  const { data: scan, error } = await supabase
    .from("scans")
    .select("id, user_id, current_status")
    .eq("id", scanId)
    .eq("user_id", user.id)
    .maybeSingle<ScanRow>();

  if (error || !scan || scan.user_id !== user.id) return failure("SCAN_NOT_FOUND");
  if (scan.current_status !== "completed") return failure("SCAN_NOT_COMPLETED");
  return { ok: true, data: { supabase, userId: user.id, scanId } };
}

async function getReadyProfile(context: {
  supabase: Awaited<ReturnType<typeof createClient>>;
  userId: string;
  scanId: string;
}): Promise<ResumeDraftRepositoryResult<{ id: string; profile: ResumeReadyProfile; resumeLanguage: ResumeLanguage }>> {
  const { data, error } = await context.supabase
    .from("resume_profiles")
    .select("id, user_id, source_scan_id, profile_data, resume_language")
    .eq("user_id", context.userId)
    .eq("source_scan_id", context.scanId)
    .maybeSingle<ResumeProfileRow>();
  if (error) return failure("DATABASE_WRITE_FAILED");
  if (!data || data.user_id !== context.userId || data.source_scan_id !== context.scanId) return failure("RESUME_PROFILE_NOT_FOUND");

  const ready = createResumeReadyProfile(data.profile_data);
  if (!ready.ok) return failure("RESUME_PROFILE_NOT_READY");
  if (ready.data.id !== data.id || ready.data.sourceScanId !== context.scanId) {
    return failure("RESUME_PROFILE_NOT_READY");
  }
  const resumeLanguage = resumeLanguageSchema.safeParse(data.resume_language);
  if (!resumeLanguage.success) return failure("RESUME_PROFILE_NOT_READY");
  return {
    ok: true,
    data: { id: data.id, profile: ready.data, resumeLanguage: resumeLanguage.data },
  };
}

function parseStoredDraft(
  row: ResumeDraftRow,
  context: { userId: string; scanId: string },
  profile: {
    id: string;
    profile: ResumeReadyProfile;
    resumeLanguage: ResumeLanguage;
  }
): ResumeDraftRepositoryResult<StoredResumeDraft> {
  const draft = resumeDraftSchema.safeParse(row.draft_data);
  const warnings = stringArray(row.validation_warnings);
  const resumeLanguage = resumeLanguageSchema.safeParse(row.resume_language);
  if (
    !draft.success ||
    !warnings ||
    !resumeLanguage.success ||
    row.user_id !== context.userId ||
    row.source_scan_id !== context.scanId ||
    row.resume_profile_id !== profile.id ||
    row.schema_version !== 1 ||
    row.prompt_version !== 1
  ) return failure("RESUME_DRAFT_INVALID");

  if (!validateGroundedResumeDraft(profile.profile, draft.data).valid) {
    return failure("RESUME_DRAFT_INVALID");
  }

  return {
    ok: true,
    data: {
      id: row.id,
      sourceScanId: row.source_scan_id,
      resumeProfileId: row.resume_profile_id,
      schemaVersion: row.schema_version,
      promptVersion: row.prompt_version,
      resumeLanguage: resumeLanguage.data,
      draft: draft.data,
      validationWarnings: warnings,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    },
  };
}

function stringArray(input: unknown): string[] | null {
  return Array.isArray(input) && input.every((item) => typeof item === "string") ? input : null;
}

function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

function failure<T = never>(code: ResumeDraftRepositoryErrorCode): ResumeDraftRepositoryResult<T> {
  const messages: Record<ResumeDraftRepositoryErrorCode, string> = {
    UNAUTHORIZED: "You need to sign in again.",
    INVALID_SCAN_ID: "We could not find this scan.",
    SCAN_NOT_FOUND: "We could not find this completed scan.",
    SCAN_NOT_COMPLETED: "This scan is not ready to use for a tailored resume.",
    RESUME_PROFILE_NOT_FOUND: "We could not find a resume profile for this scan.",
    RESUME_PROFILE_NOT_READY: "The resume profile needs trusted facts before it can be used.",
    INVALID_RESUME_DRAFT: "The tailored resume draft could not be validated.",
    RESUME_DRAFT_INVALID: "The stored tailored resume draft could not be validated.",
    DATABASE_WRITE_FAILED: "The tailored resume draft could not be saved. Please try again.",
    DATABASE_DELETE_FAILED: "The tailored resume draft could not be deleted. Please try again.",
  };
  return { ok: false, error: { code, message: messages[code] } };
}
