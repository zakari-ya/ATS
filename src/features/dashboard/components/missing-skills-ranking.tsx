import Link from "next/link";

import { Button } from "@/components/ui/button";
import type { DashboardMissingSkill } from "@/types/dashboard";

export function MissingSkillsRanking({ data }: { data: DashboardMissingSkill[] }) {
  const highestCount = data[0]?.count ?? 1;

  return (
    <section className="rounded-xl bg-white p-4 sm:p-5">
      <p className="text-sm font-medium text-[#66736f]">Recurring gaps</p>
      <h2 className="mt-1 text-lg font-semibold text-[#183f3a]">
        Most frequently missing required skills
      </h2>
      <p className="mt-1 text-sm leading-6 text-[#66736f]">
        Grouped only from your validated completed scan results.
      </p>

      {data.length === 0 ? (
        <div className="mt-5">
          <p className="text-sm leading-6 text-[#66736f]">
            Your recurring skill gaps will appear after you complete more
            job-specific scans.
          </p>
          <Button asChild variant="outline" className="mt-4 border-[#bfd2ce] bg-transparent text-[#183f3a] hover:bg-[#eef4f2]">
            <Link href="/scan">Start a scan</Link>
          </Button>
        </div>
      ) : (
        <ol className="mt-5 space-y-4">
          {data.map((skill, index) => (
            <li key={skill.name}>
              <div className="flex items-center justify-between gap-3 text-sm">
                <span className="min-w-0 truncate font-medium text-[#183f3a]">
                  {index + 1}. {skill.name}
                </span>
                <span className="shrink-0 tabular-nums text-[#66736f]">
                  {skill.count} scan{skill.count === 1 ? "" : "s"} · {skill.percentage}%
                </span>
              </div>
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[#dcebea]">
                <div
                  className="h-full rounded-full bg-[#1f4d47] transition-[width] duration-300 motion-reduce:transition-none"
                  style={{ width: `${Math.max(10, (skill.count / highestCount) * 100)}%` }}
                />
              </div>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
