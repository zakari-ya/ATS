import type { ReactNode } from "react";

import { AppSidebar } from "@/components/layout/app-sidebar";
import { AppTopbar } from "@/components/layout/app-topbar";
import { MobileBottomNav } from "@/components/layout/mobile-bottom-nav";

type AppShellProps = {
  children: ReactNode;
  userEmail?: string | null;
};

export function AppShell({ children, userEmail }: AppShellProps) {
  return (
    <div className="h-dvh overflow-hidden bg-[#f8f7f3] text-[#183f3a]">
      <div className="flex h-full min-h-0 w-full">
        <AppSidebar userEmail={userEmail} />
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
