import type { ReactNode } from "react";
import { redirect } from "next/navigation";

import { AppShell } from "@/components/layout/app-shell";
import { getTodayUsageForCurrentUser } from "@/features/usage/get-usage";
import { createClient } from "@/lib/supabase/server";

export default async function AppLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    redirect("/login");
  }

  const todayUsage = await getTodayUsageForCurrentUser();

  return (
    <AppShell userEmail={user.email} usage={todayUsage}>
      {children}
    </AppShell>
  );
}
