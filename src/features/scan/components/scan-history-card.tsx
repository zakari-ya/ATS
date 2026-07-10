import Link from "next/link";
import { ArrowUpRight, CalendarClock, CheckCircle2, Clock3, XCircle } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DeleteScanButton } from "@/features/scan/components/delete-scan-button";
import { formatScoreLabel } from "@/lib/scoring/score-labels";
import type { ScanHistoryItem } from "@/features/scan/types";
import type { ScanStatus } from "@/types/scan";

const IN_PROGRESS = new Set<ScanStatus>(["created", "uploading", "uploaded", "validating_file", "extracting_text", "analyzing", "scoring"]);

export function ScanHistoryCard({ scan }: { scan: ScanHistoryItem }) {
  const status = getStatusDisplay(scan.currentStatus);
  return (
    <article className="group border-b border-[rgba(31,77,71,0.1)] p-4 last:border-b-0 hover:bg-[#f8f7f3] sm:p-5">
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_8rem_10rem_auto] lg:items-center">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <Badge className={status.className}><status.Icon className="size-3" aria-hidden="true" />{status.label}</Badge>
            {scan.finalLabel ? <Badge variant="outline" className="border-[#cfe2de] bg-white text-[#183f3a]">{formatScoreLabel(scan.finalLabel)}</Badge> : null}
          </div>
          <h2 className="mt-3 truncate font-semibold text-[#183f3a]">{scan.jobTitle ?? "Untitled scan"}</h2>
          <p className="mt-1 flex items-center gap-1.5 text-xs text-[#66736f]"><CalendarClock className="size-3.5" aria-hidden="true" />{formatDate(scan.createdAt)}</p>
        </div>
        <div><p className="text-xs text-[#66736f]">Score</p><p className="mt-1 text-xl font-semibold tabular-nums text-[#183f3a]">{scan.finalScore === null ? "—" : `${Math.round(scan.finalScore)}%`}</p></div>
        <div><p className="text-xs text-[#66736f]">Completed</p><p className="mt-1 text-sm text-[#365a54]">{scan.completedAt ? formatDate(scan.completedAt) : "Not yet"}</p></div>
        <div className="flex items-center gap-2 lg:justify-end">
          <Button asChild variant="outline" className="h-10 flex-1 border-[#cfe2de] bg-white text-[#183f3a] hover:bg-[#eef4f2] lg:flex-none"><Link href={`/scan/${scan.id}`}>Open<ArrowUpRight className="size-4" aria-hidden="true" /></Link></Button>
          <DeleteScanButton scanId={scan.id} className="h-10 border-[#edcbc7] bg-white text-[#8f3a32] hover:bg-[#fff4f2]" label="Delete" size="sm" variant="outline" />
        </div>
      </div>
    </article>
  );
}

function getStatusDisplay(status: ScanStatus) {
  if (status === "completed") return { label: "Completed", Icon: CheckCircle2, className: "bg-[#276948] text-white" };
  if (status === "failed") return { label: "Failed", Icon: XCircle, className: "border border-[#edcbc7] bg-[#fff4f2] text-[#8f3a32]" };
  if (IN_PROGRESS.has(status)) return { label: "In progress", Icon: Clock3, className: "border border-[#cfe2de] bg-[#eef4f2] text-[#1f4d47]" };
  return { label: "Deleted", Icon: XCircle, className: "bg-[#eef4f2] text-[#66736f]" };
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("en", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" }).format(new Date(value));
}
