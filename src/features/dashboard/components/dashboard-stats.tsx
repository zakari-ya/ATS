import { CalendarDays, CheckCircle2, Gauge, Layers3 } from "lucide-react";

import { AnimatedKpi } from "@/components/motion/animated-kpi";
import type { DashboardStats as DashboardStatsData } from "@/types/dashboard";

export function DashboardStats({ stats }: { stats: DashboardStatsData }) {
  return (
    <section className="overflow-hidden rounded-xl bg-white" aria-label="Scan overview">
      <div className="grid md:grid-cols-[1.35fr_1fr_1fr_1fr]">
        <div className="bg-[#dcebea] p-5 md:p-6">
          <div className="flex items-center gap-2 text-sm font-medium text-[#365a54]">
            <Gauge className="size-4" aria-hidden="true" />
            Recent average score
          </div>
          <p className="mt-5 text-4xl font-semibold tabular-nums text-[#183f3a]">
            {stats.averageScore === null ? (
              <span className="text-2xl">No score yet</span>
            ) : (
              <AnimatedKpi value={stats.averageScore} suffix="%" decimals={0} />
            )}
          </p>
          <p className="mt-2 text-xs leading-5 text-[#55706b]">
            Based on {stats.scoreSampleSize} completed scan{stats.scoreSampleSize === 1 ? "" : "s"} in the latest 50-scan window.
          </p>
        </div>

        <Metric
          icon={CheckCircle2}
          label="Completed"
          value={stats.completedScans}
          note={`${stats.inProgressScans} currently in progress`}
        />
        <Metric
          icon={Layers3}
          label="Best recent score"
          value={stats.bestScore}
          suffix={stats.bestScore === null ? "" : "%"}
          note={`${stats.totalScans} total stored scans`}
        />
        <Metric
          icon={CalendarDays}
          label="This month"
          value={stats.completedThisMonth}
          note={`${stats.failedScans} failed in recent window`}
        />
      </div>
    </section>
  );
}

function Metric({
  icon: Icon,
  label,
  value,
  suffix = "",
  note,
}: {
  icon: typeof Gauge;
  label: string;
  value: number | null;
  suffix?: string;
  note: string;
}) {
  return (
    <div className="border-t border-[rgba(31,77,71,0.1)] p-5 md:border-l md:border-t-0">
      <div className="flex items-center gap-2 text-sm font-medium text-[#66736f]">
        <Icon className="size-4 text-[#365a54]" aria-hidden="true" />
        {label}
      </div>
      <p className="mt-5 text-2xl font-semibold tabular-nums text-[#183f3a]">
        {value === null ? "—" : <AnimatedKpi value={value} suffix={suffix} decimals={0} />}
      </p>
      <p className="mt-2 text-xs leading-5 text-[#66736f]">{note}</p>
    </div>
  );
}
