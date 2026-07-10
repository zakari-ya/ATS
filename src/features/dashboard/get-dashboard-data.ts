import "server-only";

import {
  parseSkillItems,
  parseTextArray,
} from "@/features/feedback/types";
import { getTodayUsageForCurrentUser } from "@/features/usage/get-usage";
import { createClient } from "@/lib/supabase/server";
import type {
  DashboardData,
  DashboardLabelDistribution,
  DashboardLatestInsight,
  DashboardMissingSkill,
  DashboardRecentScan,
  DashboardStats,
} from "@/types/dashboard";
import type { ScanLabel, ScanStatus } from "@/types/scan";

const DASHBOARD_SCAN_WINDOW = 50;
const SCORE_TREND_LIMIT = 12;
const IN_PROGRESS_STATUSES = new Set<ScanStatus>([
  "created",
  "uploading",
  "uploaded",
  "validating_file",
  "extracting_text",
  "analyzing",
  "scoring",
]);
const SCORE_LABELS: ScanLabel[] = [
  "great_match",
  "good_match",
  "needs_improvement",
  "low_match",
];

type ScanRow = {
  id: string;
  job_title: string | null;
  current_status: ScanStatus;
  final_score: number | string | null;
  final_label: ScanLabel | null;
  created_at: string;
  completed_at: string | null;
};

type ScanResultSummaryRow = {
  scan_id: string;
  matched_skills: unknown;
  missing_required_skills: unknown;
  recommendations: unknown;
};

type ProfileRow = {
  full_name: string | null;
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

  const monthStart = new Date();
  monthStart.setUTCDate(1);
  monthStart.setUTCHours(0, 0, 0, 0);

  const [
    usage,
    scansResult,
    totalCountResult,
    completedCountResult,
    monthCountResult,
    profileResult,
  ] = await Promise.all([
    getTodayUsageForCurrentUser(),
    supabase
      .from("scans")
      .select(
        "id, job_title, current_status, final_score, final_label, created_at, completed_at"
      )
      .eq("user_id", user.id)
      .neq("current_status", "deleted")
      .order("created_at", { ascending: false })
      .limit(DASHBOARD_SCAN_WINDOW)
      .returns<ScanRow[]>(),
    supabase
      .from("scans")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .neq("current_status", "deleted"),
    supabase
      .from("scans")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("current_status", "completed"),
    supabase
      .from("scans")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("current_status", "completed")
      .gte("completed_at", monthStart.toISOString()),
    supabase
      .from("profiles")
      .select("full_name")
      .eq("id", user.id)
      .maybeSingle<ProfileRow>(),
  ]);

  if (!usage) {
    return null;
  }

  const scans = (scansResult.data ?? []).map(normalizeScanRow);
  const completedScans = scans.filter(
    (scan) => scan.currentStatus === "completed" && scan.finalScore !== null
  );
  const completedScanIds = completedScans.map((scan) => scan.id);
  let resultRows: ScanResultSummaryRow[] = [];

  if (completedScanIds.length > 0) {
    const { data } = await supabase
      .from("scan_results")
      .select(
        "scan_id, matched_skills, missing_required_skills, recommendations"
      )
      .eq("user_id", user.id)
      .in("scan_id", completedScanIds)
      .returns<ScanResultSummaryRow[]>();

    resultRows = data ?? [];
  }

  const resultByScanId = new Map(
    resultRows.map((result) => [result.scan_id, result])
  );

  return {
    userEmail: user.email,
    userDisplayName: getUserDisplayName(
      user.email,
      profileResult.data?.full_name,
      user.user_metadata
    ),
    usage,
    stats: buildDashboardStats(scans, {
      total: totalCountResult.count ?? scans.length,
      completed: completedCountResult.count ?? completedScans.length,
      completedThisMonth: monthCountResult.count ?? 0,
    }),
    recentScans: scans.slice(0, 6),
    scoreTrend: completedScans
      .slice(0, SCORE_TREND_LIMIT)
      .reverse()
      .map((scan) => ({
        id: scan.id,
        jobTitle: scan.jobTitle ?? "Untitled scan",
        score: scan.finalScore as number,
        finalLabel: scan.finalLabel,
        date: scan.completedAt ?? scan.createdAt,
      })),
    labelDistribution: buildLabelDistribution(completedScans),
    missingSkills: buildMissingSkills(resultRows, completedScans.length),
    latestInsight: buildLatestInsight(completedScans[0], resultByScanId),
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

function buildDashboardStats(
  scans: DashboardRecentScan[],
  counts: { total: number; completed: number; completedThisMonth: number }
): DashboardStats {
  const scoredScans = scans.filter(
    (scan): scan is DashboardRecentScan & { finalScore: number } =>
      scan.currentStatus === "completed" && typeof scan.finalScore === "number"
  );
  const averageScore = scoredScans.length
    ? scoredScans.reduce((total, scan) => total + scan.finalScore, 0) /
      scoredScans.length
    : null;

  return {
    totalScans: counts.total,
    completedScans: counts.completed,
    completedThisMonth: counts.completedThisMonth,
    inProgressScans: scans.filter((scan) =>
      IN_PROGRESS_STATUSES.has(scan.currentStatus)
    ).length,
    failedScans: scans.filter((scan) => scan.currentStatus === "failed").length,
    averageScore,
    bestScore: scoredScans.length
      ? Math.max(...scoredScans.map((scan) => scan.finalScore))
      : null,
    latestScore: scoredScans[0]?.finalScore ?? null,
    scoreSampleSize: scoredScans.length,
  };
}

function buildLabelDistribution(
  completedScans: DashboardRecentScan[]
): DashboardLabelDistribution[] {
  const labeledScans = completedScans.filter((scan) => scan.finalLabel);

  return SCORE_LABELS.map((label) => {
    const count = labeledScans.filter((scan) => scan.finalLabel === label).length;
    return {
      label,
      count,
      percentage: labeledScans.length
        ? Math.round((count / labeledScans.length) * 100)
        : 0,
    };
  }).filter((item) => item.count > 0);
}

function buildMissingSkills(
  results: ScanResultSummaryRow[],
  completedScanCount: number
): DashboardMissingSkill[] {
  const counts = new Map<string, { name: string; scanIds: Set<string> }>();

  for (const result of results) {
    for (const item of parseSkillItems(result.missing_required_skills)) {
      const normalized = item.requirement.trim().toLocaleLowerCase("en");
      const existing = counts.get(normalized) ?? {
        name: item.requirement.trim(),
        scanIds: new Set<string>(),
      };
      existing.scanIds.add(result.scan_id);
      counts.set(normalized, existing);
    }
  }

  return [...counts.values()]
    .map((item) => ({
      name: item.name,
      count: item.scanIds.size,
      percentage: completedScanCount
        ? Math.round((item.scanIds.size / completedScanCount) * 100)
        : 0,
    }))
    .sort((left, right) => right.count - left.count || left.name.localeCompare(right.name))
    .slice(0, 5);
}

function buildLatestInsight(
  scan: DashboardRecentScan | undefined,
  results: Map<string, ScanResultSummaryRow>
): DashboardLatestInsight | null {
  if (!scan || scan.finalScore === null) {
    return null;
  }

  const result = results.get(scan.id);
  const matched = result ? parseSkillItems(result.matched_skills) : [];
  const missing = result ? parseSkillItems(result.missing_required_skills) : [];
  const recommendations = result ? parseTextArray(result.recommendations) : [];

  return {
    scanId: scan.id,
    jobTitle: scan.jobTitle ?? "Untitled scan",
    completedAt: scan.completedAt ?? scan.createdAt,
    finalScore: scan.finalScore,
    finalLabel: scan.finalLabel,
    matchedRequirements: matched.slice(0, 2).map((item) => item.requirement),
    missingRequiredSkills: missing.slice(0, 2).map((item) => item.requirement),
    recommendation: recommendations[0] ?? null,
  };
}

function getUserDisplayName(
  email: string,
  profileFullName: string | null | undefined,
  userMetadata: Record<string, unknown>
): string {
  const savedName = profileFullName?.trim();
  if (savedName) return savedName;

  const metadataName = userMetadata.full_name ?? userMetadata.name;
  if (typeof metadataName === "string" && metadataName.trim()) {
    return metadataName.trim();
  }

  const normalized = (email.split("@")[0] ?? "")
    .replace(/[._-]+/g, " ")
    .trim();
  if (!normalized) return "there";

  return normalized
    .split(" ")
    .filter(Boolean)
    .map((segment) => `${segment[0]?.toUpperCase() ?? ""}${segment.slice(1)}`)
    .join(" ");
}
