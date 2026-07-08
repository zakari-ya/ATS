import Link from "next/link";
import {
  ArrowUpRight,
  CalendarClock,
  CheckCircle2,
  Clock3,
  FileText,
  XCircle,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { DeleteScanButton } from "@/features/scan/components/delete-scan-button";
import { formatScoreLabel } from "@/lib/scoring/score-labels";
import type { ScanHistoryItem } from "@/features/scan/types";
import type { ScanStatus } from "@/types/scan";

type ScanHistoryCardProps = {
  scan: ScanHistoryItem;
};

const IN_PROGRESS_STATUSES = new Set<ScanStatus>([
  "created",
  "uploading",
  "uploaded",
  "validating_file",
  "extracting_text",
  "analyzing",
  "scoring",
]);

export function ScanHistoryCard({ scan }: ScanHistoryCardProps) {
  const statusDisplay = getStatusDisplay(scan.currentStatus);
  const isCompleted = scan.currentStatus === "completed";
  const actionLabel = isCompleted
    ? "View result"
    : scan.currentStatus === "failed"
      ? "Review issue"
      : "View status";

  return (
    <Card className="border-[rgba(31,77,71,0.12)] bg-[#f8f7f3] p-1 shadow-none transition duration-200 hover:border-[rgba(31,77,71,0.22)] hover:bg-white">
      <CardHeader className="gap-3 px-4 pt-4">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <Badge className={statusDisplay.badgeClassName}>
                <statusDisplay.Icon className="size-3" aria-hidden="true" />
                {statusDisplay.label}
              </Badge>
              {scan.finalLabel ? (
                <Badge
                  variant="outline"
                  className="border-[rgba(31,77,71,0.12)] bg-white text-[#183f3a]"
                >
                  {formatScoreLabel(scan.finalLabel)}
                </Badge>
              ) : null}
            </div>

            <CardTitle className="truncate text-lg font-semibold tracking-tight text-[#183f3a]">
              {scan.jobTitle ?? "Untitled scan"}
            </CardTitle>
          </div>

          <div className="flex size-10 shrink-0 items-center justify-center rounded-2xl border border-[rgba(31,77,71,0.12)] bg-white text-[#66736f]">
            <FileText className="size-5" aria-hidden="true" />
          </div>
        </div>
      </CardHeader>

      <CardContent className="px-4 pb-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <HistoryMetric label="Score" value={formatScore(scan.finalScore)} />
          <HistoryMetric
            label="Completed"
            value={formatDateTime(scan.completedAt)}
          />
        </div>

        <div className="mt-4 flex items-center gap-2 text-sm text-[#66736f]">
          <CalendarClock className="size-4 shrink-0" aria-hidden="true" />
          <span>Created {formatDateTime(scan.createdAt)}</span>
        </div>
      </CardContent>

      <CardFooter className="flex flex-col gap-2 border-[rgba(31,77,71,0.12)] bg-white/70 p-3 sm:flex-row sm:items-center sm:justify-between">
        <Button
          asChild
          variant="outline"
          className="h-10 w-full rounded-xl border-[rgba(31,77,71,0.14)] bg-white text-[#183f3a] hover:bg-[#eef4f2] sm:w-auto"
        >
          <Link href={`/scan/${scan.id}`}>
            {actionLabel}
            <ArrowUpRight className="size-4" aria-hidden="true" />
          </Link>
        </Button>
        <DeleteScanButton
          scanId={scan.id}
          className="h-10 w-full rounded-xl border-[#edcbc7] bg-white text-[#8f3a32] hover:bg-[#fff4f2] sm:w-auto"
          label="Delete"
          size="sm"
          variant="outline"
        />
      </CardFooter>
    </Card>
  );
}

function HistoryMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-[rgba(31,77,71,0.12)] bg-white p-3">
      <p className="text-xs font-medium text-[#66736f]">
        {label}
      </p>
      <p className="mt-1 text-sm font-medium text-[#183f3a]">{value}</p>
    </div>
  );
}

function getStatusDisplay(status: ScanStatus): {
  label: string;
  Icon: typeof Clock3;
  badgeClassName: string;
} {
  if (status === "completed") {
    return {
      label: "Completed",
      Icon: CheckCircle2,
      badgeClassName: "bg-[#276948] text-white",
    };
  }

  if (status === "failed") {
    return {
      label: "Failed",
      Icon: XCircle,
      badgeClassName: "bg-[#fff4f2] text-[#8f3a32] border border-[#edcbc7]",
    };
  }

  if (IN_PROGRESS_STATUSES.has(status)) {
    return {
      label: "In progress",
      Icon: Clock3,
      badgeClassName: "bg-[#eef4f2] text-[#1f4d47] border border-[#cfe2de]",
    };
  }

  return {
    label: "Deleted",
    Icon: XCircle,
    badgeClassName: "bg-[#eef4f2] text-[#66736f] border border-[rgba(31,77,71,0.12)]",
  };
}

function formatScore(value: number | null): string {
  return value === null ? "Not scored" : `${Math.round(value)}%`;
}

function formatDateTime(value: string | null): string {
  if (!value) {
    return "Not completed yet";
  }

  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}
