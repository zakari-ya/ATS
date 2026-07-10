import type { ScanLabel, ScanStatus } from "@/types/scan";
import type { TodayUsageSummary } from "@/types/usage";

export type DashboardRecentScan = {
  id: string;
  jobTitle: string | null;
  currentStatus: ScanStatus;
  finalScore: number | null;
  finalLabel: ScanLabel | null;
  createdAt: string;
  completedAt: string | null;
};

export type DashboardStats = {
  totalScans: number;
  completedScans: number;
  completedThisMonth: number;
  inProgressScans: number;
  failedScans: number;
  averageScore: number | null;
  bestScore: number | null;
  latestScore: number | null;
  scoreSampleSize: number;
};

export type DashboardScorePoint = {
  id: string;
  jobTitle: string;
  score: number;
  finalLabel: ScanLabel | null;
  date: string;
};

export type DashboardLabelDistribution = {
  label: ScanLabel;
  count: number;
  percentage: number;
};

export type DashboardMissingSkill = {
  name: string;
  count: number;
  percentage: number;
};

export type DashboardLatestInsight = {
  scanId: string;
  jobTitle: string;
  completedAt: string;
  finalScore: number;
  finalLabel: ScanLabel | null;
  matchedRequirements: string[];
  missingRequiredSkills: string[];
  recommendation: string | null;
};

export type DashboardData = {
  userEmail: string;
  userDisplayName: string;
  usage: TodayUsageSummary;
  stats: DashboardStats;
  recentScans: DashboardRecentScan[];
  scoreTrend: DashboardScorePoint[];
  labelDistribution: DashboardLabelDistribution[];
  missingSkills: DashboardMissingSkill[];
  latestInsight: DashboardLatestInsight | null;
};
