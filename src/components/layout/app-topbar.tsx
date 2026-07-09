"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowUpRight, Plus, Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { UserMenu } from "@/components/layout/user-menu";
import { appFocusRing } from "@/lib/design/tokens";
import { cn } from "@/lib/utils";

type AppTopbarProps = {
  userEmail?: string | null;
};

const routeCopy = [
  {
    match: "/dashboard",
    title: "Dashboard",
    description: "Your daily usage, scan stats, and recent CV matches.",
  },
  {
    match: "/scan/",
    title: "Scan result",
    description: "Review score, evidence, gaps, and practical next steps.",
  },
  {
    match: "/scan",
    title: "New scan",
    description: "Upload a CV PDF and compare it with one job post.",
  },
  {
    match: "/history",
    title: "History",
    description: "Previous scan summaries from lightweight scan data.",
  },
  {
    match: "/settings",
    title: "Settings",
    description: "Account and workspace preferences.",
  },
];

export function AppTopbar({ userEmail }: AppTopbarProps) {
  const pathname = usePathname();
  const copy =
    routeCopy.find((item) =>
      item.match.endsWith("/")
        ? pathname.startsWith(item.match)
        : pathname === item.match
    ) ?? routeCopy[0];

  return (
    <header className="sticky top-0 z-30 border-b border-[rgba(31,77,71,0.12)] bg-[#f8f7f3]/88 px-4 py-3 backdrop-blur-xl lg:px-5">
      <div className="flex min-h-14 items-center justify-between gap-4">
        <div className="min-w-0">
          <Link
            href="/"
            className={cn(
              "mb-2 inline-flex h-9 items-center gap-2 rounded-full border border-[rgba(31,77,71,0.12)] bg-white/86 px-3 text-sm font-medium text-[#365a54] shadow-sm shadow-[#183f3a]/5 transition-colors hover:bg-white hover:text-[#183f3a] sm:hidden",
              appFocusRing
            )}
            aria-label="Return to CVMatch landing page"
          >
            <Image
              src="/logo_cvmatch2-bgNo.png"
              alt=""
              width={32}
              height={32}
              className="size-5 object-contain"
              aria-hidden="true"
            />
            <span>CVMatch home</span>
            <ArrowUpRight className="size-3.5" aria-hidden="true" />
          </Link>
          <p className="truncate text-lg font-semibold tracking-tight text-[#183f3a]">
            {copy.title}
          </p>
          <p className="hidden truncate text-sm text-[#66736f] sm:block">
            {copy.description}
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <Button
            asChild
            variant="outline"
            size="sm"
            className={cn(
              "hidden h-10 rounded-xl border-[rgba(31,77,71,0.14)] bg-white text-[#183f3a] hover:bg-[#eef4f2] md:inline-flex",
              appFocusRing
            )}
          >
            <Link href="/history">
              <Search className="size-4" aria-hidden="true" />
              History
            </Link>
          </Button>
          <Button
            asChild
            size="sm"
            className={cn(
              "h-10 rounded-xl bg-[#183f3a] px-3 text-white hover:bg-[#1f4d47]",
              appFocusRing
            )}
          >
            <Link href="/scan">
              <Plus className="size-4" aria-hidden="true" />
              New scan
            </Link>
          </Button>
          <div className="hidden xl:block">
            <UserMenu email={userEmail} compact />
          </div>
        </div>
      </div>
    </header>
  );
}
