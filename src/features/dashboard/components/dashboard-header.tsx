import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

type DashboardHeaderProps = {
  userDisplayName: string;
  userEmail: string;
};

export function DashboardHeader({
  userDisplayName,
  userEmail,
}: DashboardHeaderProps) {
  return (
    <section className="rounded-2xl border border-[rgba(31,77,71,0.12)] bg-white p-4 shadow-sm shadow-[#183f3a]/5">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="min-w-0 space-y-2">
          <Badge className="w-fit border border-[rgba(31,77,71,0.12)] bg-[#eef4f2] text-[#183f3a]">
            <Sparkles className="size-3.5" aria-hidden="true" />
            Welcome back
          </Badge>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-[#183f3a] md:text-3xl">
              Good to see you, {userDisplayName}.
            </h1>
            <p className="mt-1 text-sm leading-6 text-[#66736f]">
              Review recent CV matches, watch daily quota, and start the next
              analysis when ready.
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <Badge
            variant="outline"
            className="h-10 max-w-full justify-start truncate rounded-xl border-[rgba(31,77,71,0.12)] bg-[#f8f7f3] px-3 text-[#66736f]"
          >
            {userEmail}
          </Badge>
          <Button
            asChild
            className="h-10 rounded-xl bg-[#183f3a] px-4 text-white hover:bg-[#1f4d47]"
          >
            <Link href="/scan">
              New scan
              <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
