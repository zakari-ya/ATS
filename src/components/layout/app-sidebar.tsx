"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, useReducedMotion } from "motion/react";
import {
  History,
  LayoutDashboard,
  ScanLine,
  Settings,
} from "lucide-react";

import { BrandLink } from "@/components/shared/brand-link";
import { UserMenu } from "@/components/layout/user-menu";
import { appFocusRing } from "@/lib/design/tokens";
import { cn } from "@/lib/utils";
import type { TodayUsageSummary } from "@/types/usage";

const navItems = [
  {
    href: "/dashboard",
    label: "Dashboard",
    icon: LayoutDashboard,
  },
  {
    href: "/scan",
    label: "Scan",
    icon: ScanLine,
  },
  {
    href: "/history",
    label: "History",
    icon: History,
  },
  {
    href: "/settings",
    label: "Settings",
    icon: Settings,
  },
];

type AppSidebarProps = {
  userEmail?: string | null;
  usage?: TodayUsageSummary | null;
};

export function AppSidebar({ userEmail, usage }: AppSidebarProps) {
  const pathname = usePathname();
  const shouldReduceMotion = useReducedMotion();

  return (
    <aside className="hidden h-dvh w-[264px] shrink-0 border-r border-white/10 bg-[#183f3a] p-3 text-white lg:flex lg:flex-col">
      <div className="rounded-2xl px-2 py-1.5">
        <BrandLink
          href="/"
          variant="dark"
          markSrc="/logo_cvmatch2-bgNo.png"
          withContainer={false}
          className={cn(
            "h-17 rounded-2xl px-2 text-[1.3rem] hover:bg-white/1",
            appFocusRing,
          )}
          markClassName="size-20"
        />
        <p className="mt-2 px-2 text-xs text-white/62">Match workspace</p>
      </div>

      <nav aria-label="Primary navigation" className="mt-7 grid gap-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive =
            pathname === item.href || pathname.startsWith(`${item.href}/`);

          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isActive ? "page" : undefined}
              className={cn(
                "relative flex h-11 items-center gap-3 rounded-xl px-3 text-sm font-medium transition-colors duration-200",
                appFocusRing,
                isActive
                  ? "text-[#183f3a]"
                  : "text-white/72 hover:bg-white/8 hover:text-white"
              )}
            >
              {isActive ? (
                <motion.span
                  layoutId="sidebar-active-route"
                  className="absolute inset-0 rounded-xl bg-white"
                  transition={shouldReduceMotion ? { duration: 0 } : { duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                  aria-hidden="true"
                />
              ) : null}
              <Icon className="relative z-10 size-4" aria-hidden="true" />
              <span className="relative z-10">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto space-y-3">
        {usage ? <SidebarUsageMeter usage={usage} /> : null}
        <UserMenu email={userEmail} compact variant="dark" />
      </div>
    </aside>
  );
}

function SidebarUsageMeter({ usage }: { usage: TodayUsageSummary }) {
  const used = Math.min(usage.aiRequestsUsed, usage.aiRequestsLimit);
  const percent = usage.aiRequestsLimit > 0
    ? Math.min(100, Math.round((used / usage.aiRequestsLimit) * 100))
    : 0;

  return (
    <div className="rounded-xl bg-white/[0.07] p-3.5">
      <div className="flex items-center justify-between gap-3 text-xs">
        <span className="font-medium text-white">Daily analyses</span>
        <span className="tabular-nums text-white/64">
          {used}/{usage.aiRequestsLimit}
        </span>
      </div>
      <div
        className="mt-2.5 h-1.5 overflow-hidden rounded-full bg-white/12"
        role="progressbar"
        aria-label="Daily AI analyses used"
        aria-valuemin={0}
        aria-valuemax={usage.aiRequestsLimit}
        aria-valuenow={used}
      >
        <div
          className="h-full rounded-full bg-[#b9d4ce] transition-[width] duration-300 motion-reduce:transition-none"
          style={{ width: `${percent}%` }}
        />
      </div>
      <p className="mt-2 text-xs text-white/58">
        {usage.remainingAiRequests} remaining · resets daily
      </p>
    </div>
  );
}
