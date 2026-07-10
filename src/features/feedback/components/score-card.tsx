import { CalendarClock, ShieldCheck } from "lucide-react";

import { AnimatedScoreRing } from "@/features/feedback/components/animated-score-ring";
import {
  formatDateTime,
  formatStatus,
  getScoreExplanation,
} from "@/features/feedback/feedback-copy";
import type { FeedbackResultDetails, FeedbackScanSummary } from "@/features/feedback/types";

export function ScoreCard({ scan, result }: { scan: FeedbackScanSummary; result: FeedbackResultDetails | null }) {
  const finalScore = scan.finalScore ?? result?.finalScore ?? null;
  const finalLabel = scan.finalLabel ?? result?.finalLabel ?? null;
  const explanation = getScoreExplanation({
    label: finalLabel,
    score: finalScore,
    missingRequiredCount: result?.missingRequiredSkills.length ?? 0,
    missingPreferredCount: result?.missingPreferredSkills.length ?? 0,
  });

  return (
    <section className="overflow-hidden rounded-xl bg-[#183f3a] p-5 text-white">
      <div className="flex flex-col items-center gap-5 sm:flex-row xl:flex-col 2xl:flex-row">
        <AnimatedScoreRing score={finalScore} label={finalLabel} />
        <div className="min-w-0 flex-1 text-center sm:text-left xl:text-center 2xl:text-left">
          <p className="text-sm font-medium text-[#b9d4ce]">{formatStatus(scan.currentStatus)}</p>
          <h2 className="mt-2 text-xl font-semibold">Your job-specific match</h2>
          <p className="mt-2 text-sm leading-6 text-white/70">{explanation}</p>
        </div>
      </div>

      <div className="mt-5 grid gap-px overflow-hidden rounded-lg bg-white/10 sm:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
        <div className="bg-white/[0.06] p-3.5">
          <div className="flex gap-2.5">
            <CalendarClock className="mt-0.5 size-4 shrink-0 text-[#b9d4ce]" aria-hidden="true" />
            <div><p className="text-xs text-white/50">Completed</p><p className="mt-1 text-sm text-white/78">{formatDateTime(scan.completedAt)}</p></div>
          </div>
        </div>
        <div className="bg-white/[0.06] p-3.5">
          <div className="flex gap-2.5">
            <ShieldCheck className="mt-0.5 size-4 shrink-0 text-[#b9d4ce]" aria-hidden="true" />
            <div><p className="text-xs text-white/50">Score control</p><p className="mt-1 text-sm text-white/78">Calculated by backend code</p></div>
          </div>
        </div>
      </div>
    </section>
  );
}
