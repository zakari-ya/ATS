import { BarChart3 } from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  formatScore,
  getBreakdownDescription,
} from "@/features/feedback/feedback-copy";
import type { FeedbackScoreBreakdown } from "@/features/feedback/types";

type ScoreBreakdownProps = {
  breakdown: FeedbackScoreBreakdown;
};

const scoreRows: Array<{
  key: keyof FeedbackScoreBreakdown;
  label: string;
}> = [
  {
    key: "requiredRequirementsScore",
    label: "Required requirements",
  },
  {
    key: "experienceRelevanceScore",
    label: "Experience relevance",
  },
  {
    key: "projectEvidenceScore",
    label: "Project evidence",
  },
  {
    key: "preferredSkillsScore",
    label: "Preferred skills",
  },
  {
    key: "cvClarityScore",
    label: "CV clarity",
  },
  {
    key: "baseWeightedScore",
    label: "Base weighted score",
  },
  {
    key: "finalScore",
    label: "Final score",
  },
];

export function ScoreBreakdown({ breakdown }: ScoreBreakdownProps) {
  return (
    <Card className="border-[rgba(31,77,71,0.12)] bg-white shadow-sm shadow-[#183f3a]/5">
      <CardHeader className="gap-2 p-4">
        <div className="mb-1 flex size-10 items-center justify-center rounded-2xl bg-[#183f3a] text-white">
          <BarChart3 className="size-5" aria-hidden="true" />
        </div>
        <CardTitle className="text-xl font-semibold tracking-tight text-[#183f3a]">
          Score breakdown
        </CardTitle>
        <CardDescription className="text-sm leading-6 text-[#66736f]">
          Scores are calculated by backend code from validated AI evidence.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-2 p-4 pt-0">
        {scoreRows.map((row) => {
          const value = breakdown[row.key];
          const progressValue = clampProgress(value);

          return (
            <div
              key={row.key}
              className="rounded-2xl border border-[rgba(31,77,71,0.12)] bg-[#f8f7f3] p-3"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="font-medium text-[#183f3a]">{row.label}</h3>
                  <p className="mt-1 text-sm leading-5 text-[#66736f]">
                    {getBreakdownDescription(row.key)}
                  </p>
                </div>
                <p className="shrink-0 font-semibold tabular-nums">
                  {formatScore(value)}
                </p>
              </div>
              <Progress
                value={progressValue}
                aria-label={`${row.label}: ${formatScore(value)}`}
                className="mt-3 h-2 bg-[#dcebea] [&_[data-slot=progress-indicator]]:bg-[#183f3a]"
              />
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}

function clampProgress(value: number | null): number {
  if (value === null) {
    return 0;
  }

  return Math.min(100, Math.max(0, value));
}
