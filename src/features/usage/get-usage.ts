import "server-only";

import { cache } from "react";

import {
  getRemainingUsage,
  isUsageLimitReached,
} from "@/features/usage/helpers";
import {
  USAGE_LIMITS,
  getDailyUsagePeriodKey,
} from "@/lib/security/usage-limits";
import { createClient } from "@/lib/supabase/server";
import type { TodayUsageSummary } from "@/types/usage";

type UsageCounterRow = {
  period_key: string;
  scans_used: number | null;
  files_uploaded: number | null;
  ai_requests_used: number | null;
};

export const getTodayUsageForCurrentUser = cache(async function getTodayUsageForCurrentUser(): Promise<TodayUsageSummary | null> {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return null;
  }

  const periodKey = getDailyUsagePeriodKey();
  const { data } = await supabase
    .from("usage_counters")
    .select("period_key, scans_used, files_uploaded, ai_requests_used")
    .eq("user_id", user.id)
    .eq("period_key", periodKey)
    .maybeSingle<UsageCounterRow>();

  const scansUsed = data?.scans_used ?? 0;
  const uploadsUsed = data?.files_uploaded ?? 0;
  const aiRequestsUsed = data?.ai_requests_used ?? 0;
  const scansLimit = USAGE_LIMITS.maxScansPerDay;
  const uploadsLimit = USAGE_LIMITS.maxFileUploadsPerDay;
  const aiRequestsLimit = USAGE_LIMITS.maxAiRequestsPerDay;

  return {
    periodKey: data?.period_key ?? periodKey,
    scansUsed,
    scansLimit,
    uploadsUsed,
    uploadsLimit,
    aiRequestsUsed,
    aiRequestsLimit,
    remainingScans: getRemainingUsage(scansUsed, scansLimit),
    remainingUploads: getRemainingUsage(uploadsUsed, uploadsLimit),
    remainingAiRequests: getRemainingUsage(aiRequestsUsed, aiRequestsLimit),
    isScanLimitReached: isUsageLimitReached(scansUsed, scansLimit),
    isUploadLimitReached: isUsageLimitReached(uploadsUsed, uploadsLimit),
    isAiLimitReached: isUsageLimitReached(aiRequestsUsed, aiRequestsLimit),
  };
});
