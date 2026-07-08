import { CalendarClock, FileCheck2, ShieldCheck } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  formatDateTime,
  formatResultLabel,
  formatScore,
  formatStatus,
  getScoreExplanation,
} from "@/features/feedback/feedback-copy";
import type {
  FeedbackResultDetails,
  FeedbackScanSummary,
} from "@/features/feedback/types";

type ScoreCardProps = {
  scan: FeedbackScanSummary;
  result: FeedbackResultDetails | null;
};

export function ScoreCard({ scan, result }: ScoreCardProps) {
  const finalScore = scan.finalScore ?? result?.finalScore ?? null;
  const finalLabel = scan.finalLabel ?? result?.finalLabel ?? null;
  const explanation = getScoreExplanation({
    label: finalLabel,
    score: finalScore,
    missingRequiredCount: result?.missingRequiredSkills.length ?? 0,
    missingPreferredCount: result?.missingPreferredSkills.length ?? 0,
  });

  return (
    <Card className="border-[#2a625b] bg-[#183f3a] text-white shadow-sm shadow-[#183f3a]/15">
      <CardHeader className="gap-4 p-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex size-11 items-center justify-center rounded-2xl bg-white text-[#183f3a]">
            <FileCheck2 className="size-5" aria-hidden="true" />
          </div>
          <Badge className="w-fit bg-white/12 text-white capitalize">
            {formatStatus(scan.currentStatus)}
          </Badge>
        </div>
        <div className="space-y-2">
          <CardTitle className="text-2xl font-semibold tracking-tight">
            {formatResultLabel(finalLabel)}
          </CardTitle>
          <CardDescription className="text-sm leading-6 text-white/68">
            {explanation}
          </CardDescription>
        </div>
      </CardHeader>

      <CardContent className="grid gap-3 p-4 pt-0">
        <div className="rounded-2xl border border-white/10 bg-white/[0.06] p-4">
          <p className="text-sm text-white/58">
            Final score
          </p>
          <p className="mt-2 text-5xl font-semibold tracking-tight">
            {formatScore(finalScore)}
          </p>
        </div>

        <div className="grid gap-3">
          <div className="rounded-2xl border border-white/10 bg-white/[0.06] p-4">
            <div className="flex gap-3">
              <CalendarClock
                className="mt-0.5 size-5 shrink-0 text-[#dcebea]"
                aria-hidden="true"
              />
              <div>
                <p className="text-sm font-medium">Completed</p>
                <p className="mt-1 text-sm leading-6 text-white/62">
                  {formatDateTime(scan.completedAt)}
                </p>
              </div>
            </div>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/[0.06] p-4">
            <div className="flex gap-3">
              <ShieldCheck
                className="mt-0.5 size-5 shrink-0 text-[#dcebea]"
                aria-hidden="true"
              />
              <div>
                <p className="text-sm font-medium">Backend controlled</p>
                <p className="mt-1 text-sm leading-6 text-white/62">
                  AI supplies evidence. The app validates JSON and calculates
                  the score in code.
                </p>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
