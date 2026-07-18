import { redirect } from "next/navigation";

import { DashboardHeader } from "@/features/dashboard/components/dashboard-header";
import { DashboardStats } from "@/features/dashboard/components/dashboard-stats";
import { LatestScanInsight } from "@/features/dashboard/components/latest-scan-insight";
import { MatchDistribution } from "@/features/dashboard/components/match-distribution";
import { MissingSkillsRanking } from "@/features/dashboard/components/missing-skills-ranking";
import { ScoreTrendChart } from "@/features/dashboard/components/score-trend-chart";
import { getDashboardDataForCurrentUser } from "@/features/dashboard/get-dashboard-data";
// import { DevRlsTestCard } from "@/features/scan/components/dev-rls-test-card";
import { UsageQuotaCard } from "@/features/usage/components/usage-quota-card";

export default async function DashboardPage() {
  const data = await getDashboardDataForCurrentUser();

  if (!data) {
    redirect("/login");
  }

  return (
    <div className="app-section-enter flex min-h-full flex-col gap-4 lg:min-h-0">
      <DashboardHeader
        userDisplayName={data.userDisplayName}
        userEmail={data.userEmail}
      />
      <DashboardStats stats={data.stats} />

      <section className="grid items-start gap-4 xl:grid-cols-12">
        <div className="space-y-4 xl:col-span-8">
          <ScoreTrendChart data={data.scoreTrend} />
          <LatestScanInsight insight={data.latestInsight} />
        </div>
        <aside className="grid content-start gap-4 xl:col-span-4">
          <MatchDistribution data={data.labelDistribution} />
          <MissingSkillsRanking data={data.missingSkills} />
          <UsageQuotaCard usage={data.usage} variant="compact" />
        </aside>
      </section>

      {/* <RecentScansCard scans={data.recentScans} />
      {process.env.NODE_ENV === "development" ? <DevRlsTestCard /> : null} */}
    </div>
  );
}
