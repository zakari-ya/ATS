"use client";

import { CalendarClock, Gauge, Sparkles, Upload } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { getUsageProgressPercent } from "@/features/usage/helpers";
import { cn } from "@/lib/utils";
import type { TodayUsageSummary } from "@/types/usage";

type UsageQuotaCardProps = {
  usage: TodayUsageSummary;
  variant?: "default" | "compact";
  className?: string;
};

type UsageMetricProps = {
  label: string;
  used: number;
  limit: number;
  remaining: number;
  tone: "ai" | "scan" | "upload";
};

function UsageMetric({
  label,
  used,
  limit,
  remaining,
  tone,
}: UsageMetricProps) {
  const percent = getUsageProgressPercent(used, limit);

  return (
    <div className="space-y-2 rounded-2xl border border-[rgba(31,77,71,0.12)] bg-[#f8f7f3] p-3">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-[#183f3a]">{label}</p>
          <p className="text-xs text-[#66736f]">
            {used} of {limit} used
          </p>
        </div>
        <Badge
          variant="outline"
          className="border-[rgba(31,77,71,0.12)] bg-white text-[#66736f]"
        >
          {remaining} left
        </Badge>
      </div>
      <Progress
        value={percent}
        className={cn(
          "h-2 bg-[#dcebea]",
          tone === "ai"
            ? "[&_[data-slot=progress-indicator]]:bg-[#183f3a]"
            : tone === "scan"
              ? "[&_[data-slot=progress-indicator]]:bg-[#1f4d47]"
              : "[&_[data-slot=progress-indicator]]:bg-[#7f9f98]"
        )}
      />
    </div>
  );
}

export function UsageQuotaCard({
  usage,
  variant = "default",
  className,
}: UsageQuotaCardProps) {
  const isCompact = variant === "compact";
  const heading = isCompact ? "Quota summary" : "Today's usage";
  const description = isCompact
    ? "AI analysis usage for today."
    : "Track today's scans, uploads, and AI analyses. Resets daily.";

  return (
    <Card
      className={cn(
        "border-[rgba(31,77,71,0.12)] bg-white shadow-sm shadow-[#183f3a]/5",
        className
      )}
    >
      <CardHeader className={cn("gap-3", isCompact ? "pb-2" : "pb-3")}>
        <div className="flex items-center justify-between gap-3">
          <div className="flex size-10 items-center justify-center rounded-2xl bg-[#183f3a] text-white">
            <Gauge className="size-5" aria-hidden="true" />
          </div>
          <Badge className="bg-[#eef4f2] text-[#183f3a]">Resets daily</Badge>
        </div>
        <div className="space-y-1.5">
          <CardTitle className={isCompact ? "text-lg" : "text-2xl"}>
            {heading}
          </CardTitle>
          <CardDescription className="text-sm leading-6 text-[#66736f]">
            {description}
          </CardDescription>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="rounded-2xl border border-[rgba(31,77,71,0.12)] bg-[#eef4f2] px-4 py-3">
          <div className="flex items-center gap-2 text-sm font-medium text-[#183f3a]">
            <Sparkles className="size-4 text-[#1f4d47]" aria-hidden="true" />
            You have {usage.remainingAiRequests} analyses left today.
          </div>
          <p className="mt-1 text-xs leading-5 text-[#66736f]">
            Period: {usage.periodKey}
          </p>
        </div>

        <div className={cn("grid gap-3", isCompact ? "md:grid-cols-1" : "")}>
          <UsageMetric
            label="AI analyses"
            used={usage.aiRequestsUsed}
            limit={usage.aiRequestsLimit}
            remaining={usage.remainingAiRequests}
            tone="ai"
          />
          {!isCompact ? (
            <>
              <UsageMetric
                label="Scans"
                used={usage.scansUsed}
                limit={usage.scansLimit}
                remaining={usage.remainingScans}
                tone="scan"
              />
              <UsageMetric
                label="Uploads"
                used={usage.uploadsUsed}
                limit={usage.uploadsLimit}
                remaining={usage.remainingUploads}
                tone="upload"
              />
            </>
          ) : null}
        </div>

        {isCompact ? (
          <div className="grid gap-2 rounded-2xl border border-[rgba(31,77,71,0.12)] bg-[#f8f7f3] p-4 text-xs text-[#66736f] sm:grid-cols-2">
            <div className="flex items-center gap-2">
              <CalendarClock className="size-4" aria-hidden="true" />
              {usage.scansUsed} / {usage.scansLimit} scans used
            </div>
            <div className="flex items-center gap-2">
              <Upload className="size-4" aria-hidden="true" />
              {usage.uploadsUsed} / {usage.uploadsLimit} uploads used
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-xs text-[#66736f]">
            <Upload className="size-4" aria-hidden="true" />
            Usage is shown for clarity here. Server-side limits still enforce
            the real protection.
          </div>
        )}
      </CardContent>
    </Card>
  );
}
