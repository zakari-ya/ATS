import { redirect } from "next/navigation";

import { DashboardCtaCard } from "@/features/dashboard/components/dashboard-cta-card";
import { DashboardHeader } from "@/features/dashboard/components/dashboard-header";
import { DashboardStats } from "@/features/dashboard/components/dashboard-stats";
import { RecentScansCard } from "@/features/dashboard/components/recent-scans-card";
import { getDashboardDataForCurrentUser } from "@/features/dashboard/get-dashboard-data";
import { DevRlsTestCard } from "@/features/scan/components/dev-rls-test-card";
import { UsageQuotaCard } from "@/features/usage/components/usage-quota-card";

export default async function DashboardPage() {
  const dashboardData = await getDashboardDataForCurrentUser();

  if (!dashboardData) {
    redirect("/login");
  }

  const showDevRlsTest = process.env.NODE_ENV === "development";

  return (
    <div className="flex min-h-full flex-col gap-4 lg:h-full lg:min-h-0">
      <DashboardHeader
        userDisplayName={dashboardData.userDisplayName}
        userEmail={dashboardData.userEmail}
      />

      <section className="grid gap-4 lg:min-h-0 lg:flex-1 xl:grid-cols-12">
        <div className="min-h-0 space-y-4 xl:col-span-8">
          <DashboardStats stats={dashboardData.stats} />
          <RecentScansCard scans={dashboardData.recentScans} />
        </div>
        <aside className="grid content-start gap-4 xl:col-span-4">
          <UsageQuotaCard usage={dashboardData.usage} variant="compact" />
          <DashboardCtaCard />
          {showDevRlsTest ? <DevRlsTestCard /> : null}
        </aside>
      </section>

    </div>
  );
}
