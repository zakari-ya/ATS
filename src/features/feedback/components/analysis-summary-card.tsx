import { ClipboardCheck, FileText, Lightbulb, Target } from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getAnalysisSummary } from "@/features/feedback/feedback-copy";
import type { FeedbackResultDetails } from "@/features/feedback/types";

type AnalysisSummaryCardProps = {
  result: FeedbackResultDetails;
};

export function AnalysisSummaryCard({ result }: AnalysisSummaryCardProps) {
  const summary = getAnalysisSummary({
    matchedCount: result.matchedSkills.length,
    missingRequiredCount: result.missingRequiredSkills.length,
    missingPreferredCount: result.missingPreferredSkills.length,
    recommendationsCount: result.recommendations.length,
  });

  const stats = [
    {
      label: "Matched",
      value: result.matchedSkills.length,
      icon: ClipboardCheck,
      description: "Visible CV evidence",
    },
    {
      label: "Required gaps",
      value: result.missingRequiredSkills.length,
      icon: Target,
      description: "Highest priority fixes",
    },
    {
      label: "Preferred gaps",
      value: result.missingPreferredSkills.length,
      icon: FileText,
      description: "Optional improvements",
    },
    {
      label: "Actions",
      value: result.recommendations.length,
      icon: Lightbulb,
      description: "CV improvements",
    },
  ];

  return (
    <Card className="border-[rgba(31,77,71,0.12)] bg-white shadow-sm shadow-[#183f3a]/5">
      <CardHeader className="gap-2 p-4">
        <CardTitle className="text-xl font-semibold tracking-tight text-[#183f3a]">
          Analysis summary
        </CardTitle>
        <CardDescription className="text-sm leading-6 text-[#66736f]">
          {summary}
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-3 p-4 pt-0 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;

          return (
            <div
              key={stat.label}
              className="rounded-2xl border border-[rgba(31,77,71,0.12)] bg-[#f8f7f3] p-4"
            >
              <Icon className="mb-4 size-5 text-[#1f4d47]" aria-hidden="true" />
              <p className="text-3xl font-semibold tracking-tight text-[#183f3a]">
                {stat.value}
              </p>
              <h2 className="mt-2 text-sm font-medium text-[#183f3a]">{stat.label}</h2>
              <p className="mt-1 text-sm leading-6 text-[#66736f]">
                {stat.description}
              </p>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
