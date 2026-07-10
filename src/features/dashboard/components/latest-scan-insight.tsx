import Link from "next/link";
import { ArrowUpRight, Check, CircleAlert } from "lucide-react";

import { Button } from "@/components/ui/button";
import { formatScoreLabel } from "@/lib/scoring/score-labels";
import type { DashboardLatestInsight } from "@/types/dashboard";

export function LatestScanInsight({ insight }: { insight: DashboardLatestInsight | null }) {
  if (!insight) {
    return (
      <section className="flex min-h-56 flex-col justify-between rounded-xl bg-[#183f3a] p-5 text-white">
        <div>
          <p className="text-sm font-medium text-white/60">Latest result</p>
          <h2 className="mt-2 text-xl font-semibold">No completed scan yet</h2>
          <p className="mt-2 max-w-md text-sm leading-6 text-white/68">
            Complete one analysis to see your score, strongest evidence, and
            highest-priority gap here.
          </p>
        </div>
        <Button asChild className="mt-6 w-fit bg-white text-[#183f3a] hover:bg-[#eef4f2]">
          <Link href="/scan">Start your first scan</Link>
        </Button>
      </section>
    );
  }

  return (
    <section className="rounded-xl bg-[#183f3a] p-5 text-white">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <p className="text-sm font-medium text-white/60">Latest completed result</p>
          <h2 className="mt-1 truncate text-xl font-semibold">{insight.jobTitle}</h2>
          <p className="mt-1 text-sm text-white/58">{formatDate(insight.completedAt)}</p>
        </div>
        <div className="shrink-0 text-left sm:text-right">
          <p className="text-4xl font-semibold tabular-nums">{Math.round(insight.finalScore)}</p>
          <p className="mt-1 text-sm text-[#c8ddd8]">
            {insight.finalLabel ? formatScoreLabel(insight.finalLabel) : "Completed"}
          </p>
        </div>
      </div>

      <div className="mt-6 grid gap-5 sm:grid-cols-2">
        <InsightList title="Visible evidence" items={insight.matchedRequirements} icon="matched" empty="No matched requirement summary stored." />
        <InsightList title="Required gaps" items={insight.missingRequiredSkills} icon="missing" empty="No required gaps were stored." />
      </div>

      {insight.recommendation ? (
        <div className="mt-5 bg-white/[0.07] p-4">
          <p className="text-xs font-medium uppercase tracking-[0.12em] text-white/50">Next improvement</p>
          <p className="mt-2 text-sm leading-6 text-white/76">{insight.recommendation}</p>
        </div>
      ) : null}

      <Button asChild variant="ghost" className="mt-4 h-10 px-0 text-white hover:bg-transparent hover:text-[#c8ddd8]">
        <Link href={`/scan/${insight.scanId}`}>
          Open full result <ArrowUpRight className="size-4" aria-hidden="true" />
        </Link>
      </Button>
    </section>
  );
}

function InsightList({ title, items, icon, empty }: { title: string; items: string[]; icon: "matched" | "missing"; empty: string }) {
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-[0.12em] text-white/50">{title}</p>
      <ul className="mt-3 space-y-2">
        {items.length ? items.map((item) => (
          <li key={item} className="flex items-start gap-2 text-sm text-white/78">
            {icon === "matched" ? <Check className="mt-0.5 size-4 shrink-0 text-[#a9c7c1]" aria-hidden="true" /> : <CircleAlert className="mt-0.5 size-4 shrink-0 text-[#e2bd82]" aria-hidden="true" />}
            <span>{item}</span>
          </li>
        )) : <li className="text-sm text-white/56">{empty}</li>}
      </ul>
    </div>
  );
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(value));
}
