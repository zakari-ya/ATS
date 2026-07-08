import { Activity, CheckCircle2, Gauge, Layers3 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { formatScoreLabel } from "@/lib/scoring/score-labels";
import type { DashboardStats as DashboardStatsData } from "@/types/dashboard";

type DashboardStatsProps = {
  stats: DashboardStatsData;
};

const statCards = [
  {
    key: "totalScans",
    label: "Total scans",
    icon: Layers3,
    toneClassName: "bg-[#183f3a] text-white",
  },
  {
    key: "completedScans",
    label: "Completed",
    icon: CheckCircle2,
    toneClassName: "bg-[#276948] text-white",
  },
  {
    key: "bestScore",
    label: "Best score",
    icon: Gauge,
    toneClassName: "bg-[#dcebea] text-[#183f3a]",
  },
  {
    key: "latestScore",
    label: "Latest score",
    icon: Activity,
    toneClassName: "bg-[#eef4f2] text-[#1f4d47]",
  },
] as const;

export function DashboardStats({ stats }: DashboardStatsProps) {
  return (
    <section className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {statCards.map((statCard) => {
          const Icon = statCard.icon;
          const summary = getStatSummary(stats, statCard.key);
          const supportingLabel = getSupportingLabel(stats, statCard.key);

          return (
            <Card
              key={statCard.key}
              className="border-[rgba(31,77,71,0.12)] bg-white shadow-sm shadow-[#183f3a]/5"
            >
              <CardContent className="space-y-3 p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-[#66736f]">
                      {statCard.label}
                    </p>
                    <p className="text-2xl font-semibold tracking-tight text-[#183f3a]">
                      {summary}
                    </p>
                  </div>
                  <div
                    className={`flex size-11 items-center justify-center rounded-2xl ${statCard.toneClassName}`}
                  >
                    <Icon className="size-5" aria-hidden="true" />
                  </div>
                </div>

                {supportingLabel ? (
                  <Badge
                    variant="outline"
                    className="border-[rgba(31,77,71,0.12)] bg-[#eef4f2] text-[#183f3a]"
                  >
                    {supportingLabel}
                  </Badge>
                ) : (
                  <p className="text-sm leading-6 text-[#66736f]">
                    Based on lightweight scan summaries only.
                  </p>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Badge className="bg-[#eef4f2] text-[#183f3a]">
          {stats.inProgressScans} in progress
        </Badge>
        <Badge className="bg-[#fff4f2] text-[#8f3a32]">
          {stats.failedScans} failed
        </Badge>
      </div>
    </section>
  );
}

function getStatSummary(
  stats: DashboardStatsData,
  key: (typeof statCards)[number]["key"]
): string {
  if (key === "totalScans") {
    return String(stats.totalScans);
  }

  if (key === "completedScans") {
    return String(stats.completedScans);
  }

  if (key === "bestScore") {
    return stats.bestScore === null ? "No score yet" : `${Math.round(stats.bestScore)}%`;
  }

  return stats.latestScore === null ? "No score yet" : `${Math.round(stats.latestScore)}%`;
}

function getSupportingLabel(
  stats: DashboardStatsData,
  key: (typeof statCards)[number]["key"]
): string | null {
  if (key === "bestScore" && stats.bestScoreLabel) {
    return formatScoreLabel(stats.bestScoreLabel);
  }

  if (key === "latestScore" && stats.latestScoreLabel) {
    return formatScoreLabel(stats.latestScoreLabel);
  }

  return null;
}
