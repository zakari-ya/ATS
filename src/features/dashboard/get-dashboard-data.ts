import "server-only";

import {
  getRemainingUsage,
  isUsageLimitReached,
} from "@/features/usage/helpers";
import {
  USAGE_LIMITS,
  getDailyUsagePeriodKey,
} from "@/lib/security/usage-limits";
import { createClient } from "@/lib/supabase/server";
import type {
  DashboardData,
  DashboardRecentScan,
  DashboardStats,
} from "@/types/dashboard";
import type { ScanLabel, ScanStatus } from "@/types/scan";
import type { TodayUsageSummary } from "@/types/usage";

const IN_PROGRESS_STATUSES = new Set<ScanStatus>([
  "created",
  "uploading",
  "uploaded",
  "validating_file",
  "extracting_text",
  "analyzing",
  "scoring",
]);

type ScanRow = {
  id: string;
  job_title: string | null;
  current_status: ScanStatus;
  final_score: number | string | null;
  final_label: ScanLabel | null;
  created_at: string;
  completed_at: string | null;
};

type UsageCounterRow = {
  period_key: string;
  scans_used: number | null;
  files_uploaded: number | null;
  ai_requests_used: number | null;
};

export async function getDashboardDataForCurrentUser(): Promise<DashboardData | null> {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user?.email) {
    return null;
  }

  const periodKey = getDailyUsagePeriodKey();
  const [usageResult, recentScansResult, totalCountResult] = await Promise.all([
    supabase
      .from("usage_counters")
      .select("period_key, scans_used, files_uploaded, ai_requests_used")
      .eq("user_id", user.id)
      .eq("period_key", periodKey)
      .maybeSingle<UsageCounterRow>(),
    // TODO: Replace the 50-row stats window with a database aggregate if the dashboard needs exact all-time breakdowns.
    supabase
      .from("scans")
      .select(
        "id, job_title, current_status, final_score, final_label, created_at, completed_at"
      )
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(50)
      .returns<ScanRow[]>(),
    supabase
      .from("scans")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id),
  ]);

  const usage = buildTodayUsageSummary(
    usageResult.data ?? null,
    usageResult.error ? periodKey : (usageResult.data?.period_key ?? periodKey)
  );
  const normalizedScans = (recentScansResult.data ?? []).map(normalizeScanRow);

  return {
    userEmail: user.email,
    userDisplayName: getUserDisplayName(user.email),
    usage,
    stats: buildDashboardStats(
      normalizedScans,
      totalCountResult.count ?? normalizedScans.length
    ),
    recentScans: normalizedScans.slice(0, 5),
  };
}

function normalizeScanRow(scan: ScanRow): DashboardRecentScan {
  return {
    id: scan.id,
    jobTitle: scan.job_title,
    currentStatus: scan.current_status,
    finalScore: normalizeScore(scan.final_score),
    finalLabel: scan.final_label,
    createdAt: scan.created_at,
    completedAt: scan.completed_at,
  };
}

function normalizeScore(value: number | string | null): number | null {
  const parsedValue =
    typeof value === "number" ? value : value ? Number(value) : null;

  return typeof parsedValue === "number" && Number.isFinite(parsedValue)
    ? parsedValue
    : null;
}

function buildTodayUsageSummary(
  row: UsageCounterRow | null,
  periodKey: string
): TodayUsageSummary {
  const scansUsed = row?.scans_used ?? 0;
  const uploadsUsed = row?.files_uploaded ?? 0;
  const aiRequestsUsed = row?.ai_requests_used ?? 0;

  return {
    periodKey,
    scansUsed,
    scansLimit: USAGE_LIMITS.maxScansPerDay,
    uploadsUsed,
    uploadsLimit: USAGE_LIMITS.maxFileUploadsPerDay,
    aiRequestsUsed,
    aiRequestsLimit: USAGE_LIMITS.maxAiRequestsPerDay,
    remainingScans: getRemainingUsage(scansUsed, USAGE_LIMITS.maxScansPerDay),
    remainingUploads: getRemainingUsage(
      uploadsUsed,
      USAGE_LIMITS.maxFileUploadsPerDay
    ),
    remainingAiRequests: getRemainingUsage(
      aiRequestsUsed,
      USAGE_LIMITS.maxAiRequestsPerDay
    ),
    isScanLimitReached: isUsageLimitReached(
      scansUsed,
      USAGE_LIMITS.maxScansPerDay
    ),
    isUploadLimitReached: isUsageLimitReached(
      uploadsUsed,
      USAGE_LIMITS.maxFileUploadsPerDay
    ),
    isAiLimitReached: isUsageLimitReached(
      aiRequestsUsed,
      USAGE_LIMITS.maxAiRequestsPerDay
    ),
  };
}

function buildDashboardStats(
  scans: DashboardRecentScan[],
  totalScanCount: number
): DashboardStats {
  const completedScans = scans.filter(
    (scan) => scan.currentStatus === "completed"
  );
  const failedScans = scans.filter((scan) => scan.currentStatus === "failed");
  const inProgressScans = scans.filter((scan) =>
    IN_PROGRESS_STATUSES.has(scan.currentStatus)
  );
  const scoredScans = scans.filter(
    (scan): scan is DashboardRecentScan & { finalScore: number } =>
      typeof scan.finalScore === "number"
  );
  const bestScoredScan = scoredScans.reduce<
    (DashboardRecentScan & { finalScore: number }) | null
  >((bestScan, currentScan) => {
    if (!bestScan || currentScan.finalScore > bestScan.finalScore) {
      return currentScan;
    }

    return bestScan;
  }, null);
  const latestScoredScan = scoredScans[0] ?? null;

  return {
    totalScans: totalScanCount,
    completedScans: completedScans.length,
    inProgressScans: inProgressScans.length,
    failedScans: failedScans.length,
    bestScore: bestScoredScan?.finalScore ?? null,
    bestScoreLabel: bestScoredScan?.finalLabel ?? null,
    latestScore: latestScoredScan?.finalScore ?? null,
    latestScoreLabel: latestScoredScan?.finalLabel ?? null,
  };
}

function getUserDisplayName(email: string): string {
  const localPart = email.split("@")[0] ?? "";
  const normalized = localPart.replace(/[._-]+/g, " ").trim();

  if (!normalized) {
    return "there";
  }

  return normalized
    .split(" ")
    .filter(Boolean)
    .map((segment) => segment[0]?.toUpperCase() + segment.slice(1))
    .join(" ");
}
