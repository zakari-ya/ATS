import "server-only";

import {
  normalizeResumeProfile,
  collectTrustedFactIds,
  evaluateResumeProfile,
} from "@/lib/resume-builder/resume-profile-utils";
import {
  resumeProfileSchema,
  type ResumeProfile,
} from "@/lib/resume-builder/resume-profile-schema";
import {
  DEFAULT_RESUME_LANGUAGE,
  resumeLanguageSettingsSchema,
  type ResumeLanguage,
  type ResumeLanguageSource,
} from "@/lib/resume-builder/resume-language";
import { createClient } from "@/lib/supabase/server";

const scanIdSchema = resumeProfileSchema.shape.sourceScanId;

export type ResumeProfileRepositoryErrorCode =
  | "UNAUTHORIZED"
  | "INVALID_SCAN_ID"
  | "SCAN_NOT_FOUND"
  | "SCAN_NOT_COMPLETED"
  | "INVALID_RESUME_PROFILE"
  | "RESUME_PROFILE_INVALID"
  | "DATABASE_WRITE_FAILED"
  | "DATABASE_DELETE_FAILED";

export type ResumeProfileRepositoryResult<T> =
  | { ok: true; data: T }
  | {
      ok: false;
      error: { code: ResumeProfileRepositoryErrorCode; message: string };
    };

export type StoredResumeProfile = {
  id: string;
  sourceScanId: string;
  schemaVersion: number;
  reviewStatus: "needs_review" | "partially_confirmed" | "confirmed";
  resumeLanguage: ResumeLanguage;
  resumeLanguageSource: ResumeLanguageSource;
  profile: ResumeProfile;
  createdAt: string;
  updatedAt: string;
};

type ScanOwnershipRow = {
  id: string;
  user_id: string;
  current_status: string;
};

type ResumeProfileRow = {
  id: string;
  user_id: string;
  source_scan_id: string;
  schema_version: number;
  profile_data: unknown;
  review_status: string;
  resume_language: string;
  resume_language_source: string;
  created_at: string;
  updated_at: string;
};

export async function getResumeProfileForScan(
  scanId: string
): Promise<ResumeProfileRepositoryResult<StoredResumeProfile | null>> {
  const context = await getAuthenticatedScanContext(scanId);
  if (!context.ok) return context;

  const { supabase, userId, scanId: safeScanId } = context.data;
  const { data, error } = await supabase
    .from("resume_profiles")
    .select(
      "id, user_id, source_scan_id, schema_version, profile_data, review_status, resume_language, resume_language_source, created_at, updated_at"
    )
    .eq("user_id", userId)
    .eq("source_scan_id", safeScanId)
    .maybeSingle<ResumeProfileRow>();

  if (error) return failure("DATABASE_WRITE_FAILED");
  if (!data) return { ok: true, data: null };

  return parseStoredResumeProfile(data, userId, safeScanId);
}

export async function upsertResumeProfileForScan(
  scanId: string,
  profileData: unknown,
  languageSettings?: unknown
): Promise<ResumeProfileRepositoryResult<StoredResumeProfile>> {
  const context = await getAuthenticatedScanContext(scanId);
  if (!context.ok) return context;

  const parsedProfile = resumeProfileSchema.safeParse(profileData);
  if (!parsedProfile.success) return failure("INVALID_RESUME_PROFILE");
  if (parsedProfile.data.sourceScanId !== context.data.scanId) {
    return failure("INVALID_RESUME_PROFILE");
  }

  const { supabase, userId, scanId: safeScanId } = context.data;
  const { data: existing, error: existingError } = await supabase
    .from("resume_profiles")
    .select("id, resume_language, resume_language_source")
    .eq("user_id", userId)
    .eq("source_scan_id", safeScanId)
    .maybeSingle<{
      id: string;
      resume_language: string;
      resume_language_source: string;
    }>();

  if (existingError) return failure("DATABASE_WRITE_FAILED");

  const normalizedProfile = normalizeResumeProfile({
    ...parsedProfile.data,
    id: existing?.id ?? parsedProfile.data.id,
  });
  const parsedLanguageSettings = languageSettings
    ? resumeLanguageSettingsSchema.safeParse(languageSettings)
    : null;
  if (parsedLanguageSettings && !parsedLanguageSettings.success) {
    return failure("INVALID_RESUME_PROFILE");
  }
  const persistedLanguageSettings =
    parsedLanguageSettings?.data ??
    parseLanguageSettings(existing) ?? {
      language: DEFAULT_RESUME_LANGUAGE,
      source: "detected" as const,
    };
  const reviewStatus = getReviewStatus(normalizedProfile);
  const { data, error } = await supabase
    .from("resume_profiles")
    .upsert(
      {
        id: normalizedProfile.id,
        user_id: userId,
        source_scan_id: safeScanId,
        schema_version: normalizedProfile.schemaVersion,
        profile_data: normalizedProfile,
        review_status: reviewStatus,
        resume_language: persistedLanguageSettings.language,
        resume_language_source: persistedLanguageSettings.source,
      },
      { onConflict: "user_id,source_scan_id" }
    )
    .select(
      "id, user_id, source_scan_id, schema_version, profile_data, review_status, resume_language, resume_language_source, created_at, updated_at"
    )
    .single<ResumeProfileRow>();

  if (error || !data) return failure("DATABASE_WRITE_FAILED");
  return parseStoredResumeProfile(data, userId, safeScanId);
}

export async function deleteResumeProfileForScan(
  scanId: string
): Promise<ResumeProfileRepositoryResult<{ deleted: true }>> {
  const context = await getAuthenticatedScanContext(scanId);
  if (!context.ok) return context;

  const { supabase, userId, scanId: safeScanId } = context.data;
  const { error } = await supabase
    .from("resume_profiles")
    .delete()
    .eq("user_id", userId)
    .eq("source_scan_id", safeScanId);

  if (error) return failure("DATABASE_DELETE_FAILED");
  return { ok: true, data: { deleted: true } };
}

async function getAuthenticatedScanContext(
  scanId: string
): Promise<
  ResumeProfileRepositoryResult<{
    supabase: Awaited<ReturnType<typeof createClient>>;
    userId: string;
    scanId: string;
  }>
> {
  const parsedScanId = scanIdSchema.safeParse(scanId);
  if (!parsedScanId.success) return failure("INVALID_SCAN_ID");

  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) return failure("UNAUTHORIZED");

  const { data: scan, error: scanError } = await supabase
    .from("scans")
    .select("id, user_id, current_status")
    .eq("id", parsedScanId.data)
    .eq("user_id", user.id)
    .maybeSingle<ScanOwnershipRow>();

  if (scanError || !scan || scan.user_id !== user.id) {
    return failure("SCAN_NOT_FOUND");
  }
  if (scan.current_status !== "completed") {
    return failure("SCAN_NOT_COMPLETED");
  }

  return {
    ok: true,
    data: { supabase, userId: user.id, scanId: parsedScanId.data },
  };
}

function parseStoredResumeProfile(
  row: ResumeProfileRow,
  userId: string,
  scanId: string
): ResumeProfileRepositoryResult<StoredResumeProfile> {
  if (row.user_id !== userId || row.source_scan_id !== scanId) {
    return failure("RESUME_PROFILE_INVALID");
  }

  const profile = resumeProfileSchema.safeParse(row.profile_data);
  if (
    !profile.success ||
    profile.data.id !== row.id ||
    profile.data.sourceScanId !== row.source_scan_id ||
    profile.data.schemaVersion !== row.schema_version ||
    !isReviewStatus(row.review_status)
  ) {
    return failure("RESUME_PROFILE_INVALID");
  }

  const normalizedProfile = normalizeResumeProfile(profile.data);
  const languageSettings = resumeLanguageSettingsSchema.safeParse({
    language: row.resume_language,
    source: row.resume_language_source,
  });
  if (!languageSettings.success) return failure("RESUME_PROFILE_INVALID");

  return {
    ok: true,
    data: {
      id: row.id,
      sourceScanId: row.source_scan_id,
      schemaVersion: row.schema_version,
      reviewStatus: row.review_status,
      resumeLanguage: languageSettings.data.language,
      resumeLanguageSource: languageSettings.data.source,
      profile: normalizedProfile,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    },
  };
}

function parseLanguageSettings(
  row:
    | {
        resume_language: string;
        resume_language_source: string;
      }
    | null
    | undefined
) {
  if (!row) return null;
  const parsed = resumeLanguageSettingsSchema.safeParse({
    language: row.resume_language,
    source: row.resume_language_source,
  });
  return parsed.success ? parsed.data : null;
}

function getReviewStatus(
  profile: ResumeProfile
): StoredResumeProfile["reviewStatus"] {
  const evaluation = evaluateResumeProfile(profile);
  if (evaluation.candidateFactIds.length === 0) return "confirmed";
  return collectTrustedFactIds(profile).length > 0
    ? "partially_confirmed"
    : "needs_review";
}

function isReviewStatus(
  value: string
): value is StoredResumeProfile["reviewStatus"] {
  return (
    value === "needs_review" ||
    value === "partially_confirmed" ||
    value === "confirmed"
  );
}

function failure<
  T = never,
  Code extends ResumeProfileRepositoryErrorCode = ResumeProfileRepositoryErrorCode
>(code: Code): ResumeProfileRepositoryResult<T> {
  return {
    ok: false,
    error: { code, message: getSafeRepositoryMessage(code) },
  };
}

function getSafeRepositoryMessage(
  code: ResumeProfileRepositoryErrorCode
): string {
  const messages: Record<ResumeProfileRepositoryErrorCode, string> = {
    UNAUTHORIZED: "You need to sign in again.",
    INVALID_SCAN_ID: "We could not find this scan.",
    SCAN_NOT_FOUND: "We could not find this completed scan.",
    SCAN_NOT_COMPLETED: "This scan is not ready to use for a resume profile.",
    INVALID_RESUME_PROFILE: "The resume profile data could not be validated.",
    RESUME_PROFILE_INVALID: "The stored resume profile could not be validated.",
    DATABASE_WRITE_FAILED: "The resume profile could not be saved. Please try again.",
    DATABASE_DELETE_FAILED: "The resume profile could not be deleted. Please try again.",
  };
  return messages[code];
}
