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
  inProgressScans: number;
  failedScans: number;
  bestScore: number | null;
  bestScoreLabel: ScanLabel | null;
  latestScore: number | null;
  latestScoreLabel: ScanLabel | null;
};

export type DashboardData = {
  userEmail: string;
  userDisplayName: string;
  usage: TodayUsageSummary;
  stats: DashboardStats;
  recentScans: DashboardRecentScan[];
};
