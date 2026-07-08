"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
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
};

export function AppSidebar({ userEmail }: AppSidebarProps) {
  const pathname = usePathname();

  return (
    <aside className="hidden h-dvh w-[264px] shrink-0 border-r border-white/10 bg-[#183f3a] p-3 text-white lg:flex lg:flex-col">
      <div className="rounded-2xl px-2 py-1.5">
        <BrandLink
          href="/"
          variant="dark"
          markSrc="/logo_cvmatch2-bgNo.png"
          withContainer={false}
          className={cn(
            "h-14 rounded-2xl px-2 text-[1.3rem] hover:bg-white/8",
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
                "flex h-12 items-center gap-3 rounded-2xl px-3 text-sm font-medium transition",
                appFocusRing,
                isActive
                  ? "bg-white text-[#183f3a] shadow-sm"
                  : "text-white/72 hover:bg-white/8 hover:text-white"
              )}
            >
              <Icon className="size-4" aria-hidden="true" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto space-y-3">
        <div className="rounded-2xl border border-white/10 bg-white/[0.06] p-4">
          <p className="text-sm font-medium">Private scan flow</p>
          <p className="mt-1 text-xs leading-5 text-white/62">
            Uploads, analysis, scoring, and deletion stay inside your protected
            workspace.
          </p>
        </div>
        <UserMenu email={userEmail} compact variant="dark" />
      </div>
    </aside>
  );
}
