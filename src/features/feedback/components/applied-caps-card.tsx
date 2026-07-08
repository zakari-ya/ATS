import { Gauge, LockKeyhole } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { formatScore, getCapIntro } from "@/features/feedback/feedback-copy";
import type { FeedbackAppliedCap } from "@/features/feedback/types";

type AppliedCapsCardProps = {
  appliedCaps: FeedbackAppliedCap[];
};

export function AppliedCapsCard({ appliedCaps }: AppliedCapsCardProps) {
  return (
    <Card className="border-[rgba(31,77,71,0.12)] bg-white shadow-sm shadow-[#183f3a]/5">
      <CardHeader className="gap-2 p-4">
        <div className="mb-1 flex size-10 items-center justify-center rounded-2xl bg-[#183f3a] text-white">
          <Gauge className="size-5" aria-hidden="true" />
        </div>
        <CardTitle className="text-xl font-semibold tracking-tight text-[#183f3a]">
          Why the score was limited
        </CardTitle>
        <CardDescription className="text-sm leading-6 text-[#66736f]">
          {getCapIntro(appliedCaps)}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3 p-4 pt-0">
        {appliedCaps.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-[rgba(31,77,71,0.18)] bg-[#f8f7f3] p-5 text-sm leading-6 text-[#66736f]">
            The backend did not apply any score caps for this result.
          </div>
        ) : null}

        {appliedCaps.map((cap, index) => (
          <article
            key={`${cap.reason}-${index}`}
            className="rounded-2xl border border-[rgba(31,77,71,0.12)] bg-[#f8f7f3] p-4"
          >
            <div className="flex gap-3">
              <div className="mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-xl bg-[#fff7f0] text-[#9a3412]">
                <LockKeyhole className="size-5" aria-hidden="true" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <h3 className="font-medium text-[#183f3a]">Score cap</h3>
                  {cap.maxScore !== null ? (
                    <Badge
                      variant="outline"
                      className="w-fit border-[#f0d0b8] bg-[#fff7f0] text-[#9a3412]"
                    >
                      Max {formatScore(cap.maxScore)}
                    </Badge>
                  ) : null}
                </div>
                <p className="mt-2 text-sm leading-6 text-[#66736f]">
                  {cap.reason}
                </p>
              </div>
            </div>
          </article>
        ))}
      </CardContent>
    </Card>
  );
}
