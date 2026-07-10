import { formatScoreLabel } from "@/lib/scoring/score-labels";
import type { DashboardLabelDistribution } from "@/types/dashboard";

const labelColors: Record<DashboardLabelDistribution["label"], string> = {
  great_match: "bg-[#276948]",
  good_match: "bg-[#5f8f78]",
  needs_improvement: "bg-[#c3944d]",
  low_match: "bg-[#a95b50]",
};

export function MatchDistribution({ data }: { data: DashboardLabelDistribution[] }) {
  const total = data.reduce((sum, item) => sum + item.count, 0);

  return (
    <section className="rounded-xl bg-[#eef4f2] p-4 sm:p-5">
      <p className="text-sm font-medium text-[#66736f]">Result distribution</p>
      <div className="mt-1 flex items-end justify-between gap-4">
        <h2 className="text-lg font-semibold text-[#183f3a]">Stored labels</h2>
        <span className="text-sm tabular-nums text-[#66736f]">{total} completed</span>
      </div>

      {total === 0 ? (
        <p className="mt-6 text-sm leading-6 text-[#66736f]">
          Completed result labels will appear here after your first analysis.
        </p>
      ) : (
        <>
          <div className="mt-5 flex h-3 overflow-hidden rounded-full bg-white" aria-label={`Distribution across ${total} completed scans`}>
            {data.map((item) => (
              <div
                key={item.label}
                className={`${labelColors[item.label]} transition-[width] duration-300 motion-reduce:transition-none`}
                style={{ width: `${item.percentage}%` }}
                title={`${formatScoreLabel(item.label)}: ${item.count}`}
              />
            ))}
          </div>
          <div className="mt-4 space-y-2.5">
            {data.map((item) => (
              <div key={item.label} className="flex items-center justify-between gap-3 text-sm">
                <span className="flex min-w-0 items-center gap-2 text-[#365a54]">
                  <span className={`size-2 shrink-0 rounded-full ${labelColors[item.label]}`} aria-hidden="true" />
                  <span className="truncate">{formatScoreLabel(item.label)}</span>
                </span>
                <span className="shrink-0 tabular-nums text-[#66736f]">{item.count} · {item.percentage}%</span>
              </div>
            ))}
          </div>
        </>
      )}
    </section>
  );
}
