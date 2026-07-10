import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { Button } from "@/components/ui/button";

export function DashboardHeader({
  userDisplayName,
}: {
  userDisplayName: string;
  userEmail: string;
}) {
  return (
    <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        <p className="text-sm font-medium text-[#66736f]">Welcome back</p>
        <h1 className="mt-1 text-2xl font-semibold text-[#183f3a] sm:text-3xl">
          {userDisplayName}&apos;s CVMatch overview
        </h1>
        <p className="mt-1 max-w-2xl text-sm leading-6 text-[#66736f]">
          Track real match results, recurring requirement gaps, and today&apos;s usage.
        </p>
      </div>
      <Button asChild className="h-11 shrink-0 bg-[#183f3a] px-5 text-white hover:bg-[#1f4d47]">
        <Link href="/scan">
          New scan <ArrowRight className="size-4" aria-hidden="true" />
        </Link>
      </Button>
    </header>
  );
}
