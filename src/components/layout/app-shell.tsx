"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";

import { AppSidebar } from "@/components/layout/app-sidebar";
import { AppTopbar } from "@/components/layout/app-topbar";
import { MobileBottomNav } from "@/components/layout/mobile-bottom-nav";
import type { TodayUsageSummary } from "@/types/usage";

type AppShellProps = {
  children: ReactNode;
  userEmail?: string | null;
  usage?: TodayUsageSummary | null;
};

const resumeWorkspacePattern = /^\/scan\/[0-9a-f-]+\/resume$/i;

export function AppShell({ children, userEmail, usage }: AppShellProps) {
  const pathname = usePathname();
  const isResumeWorkspace = resumeWorkspacePattern.test(pathname);

  if (isResumeWorkspace) {
    return (
      <div className="h-dvh overflow-hidden bg-[#f8f7f3] text-[#183f3a]">
        <main
          data-app-scroll-container
          className="h-full min-h-0 overflow-y-auto pb-[calc(5rem+env(safe-area-inset-bottom))] lg:overflow-hidden lg:pb-0"
        >
          {children}
        </main>
        <MobileBottomNav />
      </div>
    );
  }

  return (
    <div className="h-dvh overflow-hidden bg-[#f8f7f3] text-[#183f3a]">
      <div className="flex h-full min-h-0 w-full">
        <AppSidebar userEmail={userEmail} usage={usage} />
        <div className="flex min-w-0 flex-1 flex-col">
          <AppTopbar userEmail={userEmail} />
          <main
            data-app-scroll-container
            className="min-h-0 flex-1 scroll-pb-[calc(7rem+env(safe-area-inset-bottom))] overflow-y-auto overscroll-contain px-3 py-3 pb-[calc(7rem+env(safe-area-inset-bottom))] sm:px-4 sm:py-4 lg:px-5 lg:pb-5"
          >
            {children}
          </main>
        </div>
        <MobileBottomNav />
      </div>
    </div>
  );
}
