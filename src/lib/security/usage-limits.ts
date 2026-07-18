import "server-only";

import {
  JOB_DESCRIPTION_MAX_LENGTH,
  JOB_DESCRIPTION_MIN_LENGTH,
  MAX_CV_FILE_SIZE_BYTES,
} from "@/features/scan/constants";
import { getUsageLimitMessage } from "@/lib/security/rate-limit-errors";
import { createAdminClient } from "@/lib/supabase/admin";
import type {
  DailyUsage,
  UsageActionKey,
  UsageCounterName,
  UsageIncrementResult,
  UsageLimitCheckResult,
} from "@/types/usage";

const DEFAULT_USAGE_LIMITS = {
  maxScansPerDay: 5,
  maxFileUploadsPerDay: 10,
  maxAiRequestsPerDay: 5,
  maxCvFileSizeBytes: MAX_CV_FILE_SIZE_BYTES,
  maxJobDescriptionChars: JOB_DESCRIPTION_MAX_LENGTH,
  minJobDescriptionChars: JOB_DESCRIPTION_MIN_LENGTH,
} as const;

function parsePositiveIntegerEnv(
  value: string | undefined,
  fallback: number
): number {
  if (!value) {
    return fallback;
  }

  const parsed = Number.parseInt(value, 10);

  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

export function getUsageLimitsConfig(
  env: Partial<Record<string, string | undefined>> = process.env
) {
  return {
    maxScansPerDay: parsePositiveIntegerEnv(
      env.MAX_SCANS_PER_DAY,
      DEFAULT_USAGE_LIMITS.maxScansPerDay
    ),
    maxFileUploadsPerDay: parsePositiveIntegerEnv(
      env.MAX_FILE_UPLOADS_PER_DAY,
      DEFAULT_USAGE_LIMITS.maxFileUploadsPerDay
    ),
    maxAiRequestsPerDay: parsePositiveIntegerEnv(
      env.MAX_AI_REQUESTS_PER_DAY,
      DEFAULT_USAGE_LIMITS.maxAiRequestsPerDay
    ),
    maxCvFileSizeBytes: parsePositiveIntegerEnv(
      env.MAX_CV_FILE_SIZE_BYTES,
      DEFAULT_USAGE_LIMITS.maxCvFileSizeBytes
    ),
    maxJobDescriptionChars: parsePositiveIntegerEnv(
      env.MAX_JOB_DESCRIPTION_CHARS,
      DEFAULT_USAGE_LIMITS.maxJobDescriptionChars
    ),
    minJobDescriptionChars: parsePositiveIntegerEnv(
      env.MIN_JOB_DESCRIPTION_CHARS,
      DEFAULT_USAGE_LIMITS.minJobDescriptionChars
    ),
  } as const;
}

export const USAGE_LIMITS = getUsageLimitsConfig();

type UsageCounterRow = {
  user_id: string;
  period_key: string;
  scans_used: number | null;
  files_uploaded: number | null;
  ai_requests_used: number | null;
};

type UsageCounterRpcRow = {
  scans_used: number | null;
  files_uploaded: number | null;
  ai_requests_used: number | null;
};

export function getDailyUsagePeriodKey(date = new Date()): string {
  return date.toISOString().slice(0, 10);
}

export async function getUserUsageForToday({
  userId,
}: {
  userId: string;
}): Promise<DailyUsage> {
  const periodKey = getDailyUsagePeriodKey();
  const adminSupabase = createAdminClient();

  const { data, error } = await adminSupabase
    .from("usage_counters")
    .select("user_id, period_key, scans_used, files_uploaded, ai_requests_used")
    .eq("user_id", userId)
    .eq("period_key", periodKey)
    .maybeSingle<UsageCounterRow>();

  if (error) {
    throw new Error("Usage counter read failed.");
  }

  return normalizeUsageRow({
    row: data,
    userId,
    periodKey,
  });
}

export async function checkDailyScanLimit({
  userId,
}: {
  userId: string;
}): Promise<UsageLimitCheckResult> {
  let usage: DailyUsage;

  try {
    usage = await getUserUsageForToday({ userId });
  } catch {
    return usageCheckFailed(USAGE_LIMITS.maxScansPerDay);
  }

  if (usage.scansUsed >= USAGE_LIMITS.maxScansPerDay) {
    return {
      ok: false,
      errorCode: "DAILY_SCAN_LIMIT_REACHED",
      message: getUsageLimitMessage("DAILY_SCAN_LIMIT_REACHED"),
      limit: USAGE_LIMITS.maxScansPerDay,
      used: usage.scansUsed,
    };
  }

  return { ok: true };
}

export async function checkDailyUploadLimit({
  userId,
}: {
  userId: string;
}): Promise<UsageLimitCheckResult> {
  let usage: DailyUsage;

  try {
    usage = await getUserUsageForToday({ userId });
  } catch {
    return usageCheckFailed(USAGE_LIMITS.maxFileUploadsPerDay);
  }

  if (usage.filesUploaded >= USAGE_LIMITS.maxFileUploadsPerDay) {
    return {
      ok: false,
      errorCode: "DAILY_UPLOAD_LIMIT_REACHED",
      message: getUsageLimitMessage("DAILY_UPLOAD_LIMIT_REACHED"),
      limit: USAGE_LIMITS.maxFileUploadsPerDay,
      used: usage.filesUploaded,
    };
  }

  return { ok: true };
}

export async function checkDailyAiLimit({
  userId,
}: {
  userId: string;
}): Promise<UsageLimitCheckResult> {
  let usage: DailyUsage;

  try {
    usage = await getUserUsageForToday({ userId });
  } catch {
    return usageCheckFailed(USAGE_LIMITS.maxAiRequestsPerDay);
  }

  if (usage.aiRequestsUsed >= USAGE_LIMITS.maxAiRequestsPerDay) {
    return {
      ok: false,
      errorCode: "DAILY_AI_LIMIT_REACHED",
      message: getUsageLimitMessage("DAILY_AI_LIMIT_REACHED"),
      limit: USAGE_LIMITS.maxAiRequestsPerDay,
      used: usage.aiRequestsUsed,
    };
  }

  return { ok: true };
}

/**
 * Named action boundary for provider-backed work. The current schema has one
 * protected provider-request counter, so resume generation shares it rather
 * than adding a parallel counter that could be bypassed.
 */
export async function checkUsageActionLimit({
  userId,
  action,
}: {
  userId: string;
  action: UsageActionKey;
}): Promise<UsageLimitCheckResult> {
  switch (action) {
    case "ai_analysis":
    case "resume_generation":
    case "resume_profile_initialization":
      return checkDailyAiLimit({ userId });
  }
}

export async function consumeUsageAction({
  userId,
  action,
}: {
  userId: string;
  action: UsageActionKey;
}): Promise<UsageIncrementResult> {
  switch (action) {
    case "ai_analysis":
    case "resume_generation":
    case "resume_profile_initialization":
      return incrementDailyUsageCounter({
        userId,
        counterName: "ai_requests_used",
      });
  }
}

export async function incrementDailyUsageCounter({
  userId,
  counterName,
}: {
  userId: string;
  counterName: UsageCounterName;
}): Promise<UsageIncrementResult> {
  if (!isAllowedUsageCounterName(counterName)) {
    return usageCounterFailed();
  }

  const periodKey = getDailyUsagePeriodKey();
  let adminSupabase: ReturnType<typeof createAdminClient>;

  try {
    adminSupabase = createAdminClient();
  } catch {
    return usageCounterFailed();
  }

  const { data, error } = await adminSupabase
    .rpc("increment_usage_counter", {
      p_user_id: userId,
      p_period_key: periodKey,
      p_counter_name: counterName,
    })
    .maybeSingle<UsageCounterRpcRow>();

  if (!error && data) {
    return {
      ok: true,
      usage: normalizeUsageRow({
        row: {
          user_id: userId,
          period_key: periodKey,
          scans_used: data.scans_used,
          files_uploaded: data.files_uploaded,
          ai_requests_used: data.ai_requests_used,
        },
        userId,
        periodKey,
      }),
    };
  }

  const fallbackResult = await incrementDailyUsageCounterWithLegacyUpsert({
    adminSupabase,
    userId,
    periodKey,
    counterName,
  });

  if (!fallbackResult) {
    return usageCounterFailed();
  }

  return {
    ok: true,
    usage: fallbackResult,
  };
}

function normalizeUsageRow({
  row,
  userId,
  periodKey,
}: {
  row: UsageCounterRow | null;
  userId: string;
  periodKey: string;
}): DailyUsage {
  return {
    userId,
    periodKey,
    scansUsed: row?.scans_used ?? 0,
    filesUploaded: row?.files_uploaded ?? 0,
    aiRequestsUsed: row?.ai_requests_used ?? 0,
  };
}

function isAllowedUsageCounterName(value: string): value is UsageCounterName {
  return (
    value === "scans_used" ||
    value === "files_uploaded" ||
    value === "ai_requests_used"
  );
}

async function incrementDailyUsageCounterWithLegacyUpsert({
  adminSupabase,
  userId,
  periodKey,
  counterName,
}: {
  adminSupabase: ReturnType<typeof createAdminClient>;
  userId: string;
  periodKey: string;
  counterName: UsageCounterName;
}): Promise<DailyUsage | null> {
  // Compatibility fallback for environments where the increment_usage_counter
  // RPC migration has not been applied yet.
  const { error: upsertError } = await adminSupabase.from("usage_counters").upsert(
    {
      user_id: userId,
      period_key: periodKey,
    },
    {
      onConflict: "user_id,period_key",
      ignoreDuplicates: false,
    },
  );

  if (upsertError) {
    return null;
  }

  const { data, error } = await adminSupabase
    .from("usage_counters")
    .select("user_id, period_key, scans_used, files_uploaded, ai_requests_used")
    .eq("user_id", userId)
    .eq("period_key", periodKey)
    .maybeSingle<UsageCounterRow>();

  if (error) {
    return null;
  }

  const currentUsage = normalizeUsageRow({
    row: data,
    userId,
    periodKey,
  });
  const nextValue = getUsageCounterValue(currentUsage, counterName) + 1;

  const { error: updateError } = await adminSupabase
    .from("usage_counters")
    .update({
      [counterName]: nextValue,
    })
    .eq("user_id", userId)
    .eq("period_key", periodKey);

  if (updateError) {
    return null;
  }

  return {
    ...currentUsage,
    [mapUsageCounterNameToDailyUsageKey(counterName)]: nextValue,
  };
}

function getUsageCounterValue(
  usage: DailyUsage,
  counterName: UsageCounterName,
): number {
  switch (counterName) {
    case "scans_used":
      return usage.scansUsed;
    case "files_uploaded":
      return usage.filesUploaded;
    case "ai_requests_used":
      return usage.aiRequestsUsed;
  }
}

function mapUsageCounterNameToDailyUsageKey(
  counterName: UsageCounterName,
): keyof Pick<DailyUsage, "scansUsed" | "filesUploaded" | "aiRequestsUsed"> {
  switch (counterName) {
    case "scans_used":
      return "scansUsed";
    case "files_uploaded":
      return "filesUploaded";
    case "ai_requests_used":
      return "aiRequestsUsed";
  }
}

function usageCounterFailed(): UsageIncrementResult {
  return {
    ok: false,
    errorCode: "USAGE_COUNTER_FAILED",
    message: getUsageLimitMessage("USAGE_COUNTER_FAILED"),
  };
}

function usageCheckFailed(limit: number): UsageLimitCheckResult {
  return {
    ok: false,
    errorCode: "USAGE_COUNTER_FAILED",
    message: getUsageLimitMessage("USAGE_COUNTER_FAILED"),
    limit,
    used: 0,
  };
}
