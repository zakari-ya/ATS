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
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { formatScoreLabel } from "@/lib/scoring/score-labels";
import type { DashboardRecentScan } from "@/types/dashboard";
import type { ScanStatus } from "@/types/scan";

type RecentScansCardProps = {
  scans: DashboardRecentScan[];
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

export function RecentScansCard({ scans }: RecentScansCardProps) {
  return (
    <Card className="min-h-0 border-[rgba(31,77,71,0.12)] bg-white shadow-sm shadow-[#183f3a]/5">
      <CardHeader className="gap-3 p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-2">
            <p className="text-sm font-medium text-[#66736f]">
              Recent scans
            </p>
            <CardTitle className="text-xl font-semibold tracking-tight text-[#183f3a]">
              Your latest CV matches
            </CardTitle>
            <CardDescription className="text-sm leading-6 text-[#66736f]">
              This section stays lightweight by reading scan summaries only.
            </CardDescription>
          </div>
          <Button
            asChild
            variant="outline"
            className="rounded-xl border-[rgba(31,77,71,0.14)] bg-white text-[#183f3a] hover:bg-[#eef4f2]"
          >
            <Link href="/history">View history</Link>
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-3 p-4 pt-0 lg:max-h-[44dvh] lg:overflow-auto xl:max-h-[calc(100dvh-24rem)]">
        {scans.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-[rgba(31,77,71,0.18)] bg-[#eef4f2] p-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="space-y-1">
                <h3 className="font-medium text-[#183f3a]">No scans yet.</h3>
                <p className="text-sm leading-6 text-[#66736f]">
                  Start your first CV match analysis by uploading your CV and
                  pasting a job post.
                </p>
              </div>
              <Button
                asChild
                className="rounded-xl bg-[#183f3a] text-white hover:bg-[#1f4d47]"
              >
                <Link href="/scan">New scan</Link>
              </Button>
            </div>
          </div>
        ) : null}

        {scans.length > 0 ? (
          <div className="grid gap-3">
            {scans.map((scan) => {
              const statusDisplay = getStatusDisplay(scan.currentStatus);
              const scanMessage = getScanMessage(scan.currentStatus);

              return (
                <article
                  key={scan.id}
                  className="rounded-2xl border border-[rgba(31,77,71,0.12)] bg-[#f8f7f3] p-4 transition duration-200 hover:border-[rgba(31,77,71,0.22)]"
                >
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0 space-y-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge className={statusDisplay.badgeClassName}>
                          <statusDisplay.Icon
                            className="size-3"
                            aria-hidden="true"
                          />
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

                      <div className="space-y-1">
                        <h3 className="truncate text-base font-semibold tracking-tight text-[#183f3a]">
                          {scan.jobTitle ?? "Untitled scan"}
                        </h3>
                        <p className="text-sm leading-6 text-[#66736f]">
                          {scanMessage}
                        </p>
                      </div>

                      <div className="flex flex-wrap items-center gap-3 text-sm text-[#66736f]">
                        <span className="inline-flex items-center gap-1">
                          <CalendarClock className="size-4" aria-hidden="true" />
                          {formatDate(scan.createdAt)}
                        </span>
                        <span className="rounded-full border border-[rgba(31,77,71,0.12)] bg-white px-3 py-1 text-[#183f3a]">
                          {scan.finalScore === null
                            ? "Not scored yet"
                            : `${Math.round(scan.finalScore)}%`}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="flex size-10 shrink-0 items-center justify-center rounded-2xl border border-[rgba(31,77,71,0.12)] bg-white text-[#66736f]">
                        <FileText className="size-5" aria-hidden="true" />
                      </div>
                      <Button
                        asChild
                        variant="outline"
                        className="rounded-xl border-[rgba(31,77,71,0.14)] bg-white text-[#183f3a] hover:bg-[#eef4f2]"
                      >
                        <Link href={`/scan/${scan.id}`}>
                          Open
                          <ArrowUpRight className="size-4" aria-hidden="true" />
                        </Link>
                      </Button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        ) : null}
      </CardContent>
    </Card>
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
      badgeClassName: "border border-[#edcbc7] bg-[#fff4f2] text-[#8f3a32]",
    };
  }

  if (IN_PROGRESS_STATUSES.has(status)) {
    return {
      label: "In progress",
      Icon: Clock3,
      badgeClassName: "border border-[#cfe2de] bg-[#eef4f2] text-[#1f4d47]",
    };
  }

  return {
    label: "Deleted",
    Icon: XCircle,
    badgeClassName: "border border-[rgba(31,77,71,0.12)] bg-[#eef4f2] text-[#66736f]",
  };
}

function getScanMessage(status: ScanStatus): string {
  if (status === "failed") {
    return "This scan failed. Try again with a clean text-based CV PDF.";
  }

  if (status === "completed") {
    return "Open the result to review your score, matched skills, and next improvements.";
  }

  return "This scan is still being analyzed.";
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}
