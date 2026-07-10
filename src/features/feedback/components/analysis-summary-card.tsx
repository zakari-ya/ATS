import { getAnalysisSummary } from "@/features/feedback/feedback-copy";
import type { FeedbackResultDetails } from "@/features/feedback/types";

export function AnalysisSummaryCard({ result }: { result: FeedbackResultDetails }) {
  const exact = result.matchedSkills.filter((item) => item.matchStatus === "exact_match").length;
  const semantic = result.matchedSkills.filter((item) => item.matchStatus === "semantic_match").length;
  const partial = result.matchedSkills.filter((item) => item.matchStatus === "partial_match").length;
  const total = result.matchedSkills.length + result.missingRequiredSkills.length + result.missingPreferredSkills.length;
  const matchedPercent = total ? Math.round((result.matchedSkills.length / total) * 100) : 0;
  const summary = getAnalysisSummary({
    matchedCount: result.matchedSkills.length,
    missingRequiredCount: result.missingRequiredSkills.length,
    missingPreferredCount: result.missingPreferredSkills.length,
    recommendationsCount: result.recommendations.length,
  });

  return (
    <section className="rounded-xl bg-white p-4 sm:p-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium text-[#66736f]">Requirements overview</p>
          <h2 className="mt-1 text-xl font-semibold text-[#183f3a]">What the analysis found</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-[#66736f]">{summary}</p>
        </div>
        <p className="text-3xl font-semibold tabular-nums text-[#183f3a]">{matchedPercent}% <span className="text-sm font-normal text-[#66736f]">visible</span></p>
      </div>

      <div className="mt-5 flex h-2.5 overflow-hidden rounded-full bg-[#edf1ef]" aria-label={`${result.matchedSkills.length} matched, ${result.missingRequiredSkills.length} missing required, ${result.missingPreferredSkills.length} missing preferred`}>
        {total > 0 ? <>
          <div className="bg-[#276948]" style={{ width: `${(result.matchedSkills.length / total) * 100}%` }} />
          <div className="bg-[#b66c55]" style={{ width: `${(result.missingRequiredSkills.length / total) * 100}%` }} />
          <div className="bg-[#c99d58]" style={{ width: `${(result.missingPreferredSkills.length / total) * 100}%` }} />
        </> : null}
      </div>

      <div className="mt-5 grid gap-px overflow-hidden rounded-lg bg-[#dbe5e2] sm:grid-cols-4">
        <SummaryMetric label="Matched" value={result.matchedSkills.length} note={`${exact} exact · ${semantic} semantic · ${partial} partial`} />
        <SummaryMetric label="Required gaps" value={result.missingRequiredSkills.length} note="Highest-priority gaps" />
        <SummaryMetric label="Preferred gaps" value={result.missingPreferredSkills.length} note="Lower score impact" />
        <SummaryMetric label="Next actions" value={result.recommendations.length} note="Stored recommendations" />
      </div>
    </section>
  );
}

function SummaryMetric({ label, value, note }: { label: string; value: number; note: string }) {
  return <div className="bg-[#f8f7f3] p-4"><p className="text-2xl font-semibold tabular-nums text-[#183f3a]">{value}</p><p className="mt-1 text-sm font-medium text-[#365a54]">{label}</p><p className="mt-1 text-xs text-[#66736f]">{note}</p></div>;
}
