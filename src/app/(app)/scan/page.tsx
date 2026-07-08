import { redirect } from "next/navigation";

import { ScanPageClient } from "@/features/scan/components/scan-page-client";
import { getTodayUsageForCurrentUser } from "@/features/usage/get-usage";

export default async function ScanPage() {
  const todayUsage = await getTodayUsageForCurrentUser();

  if (!todayUsage) {
    redirect("/login");
  }

  return <ScanPageClient todayUsage={todayUsage} />;
}
