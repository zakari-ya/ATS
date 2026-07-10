import Link from "next/link";
import { ArrowUpRight, CheckCircle2, Clock3, XCircle } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatScoreLabel } from "@/lib/scoring/score-labels";
import type { DashboardRecentScan } from "@/types/dashboard";
import type { ScanStatus } from "@/types/scan";

const IN_PROGRESS = new Set<ScanStatus>(["created", "uploading", "uploaded", "validating_file", "extracting_text", "analyzing", "scoring"]);

export function RecentScansCard({ scans }: { scans: DashboardRecentScan[] }) {
  return (
    <section className="overflow-hidden rounded-xl bg-white">
      <header className="flex flex-col gap-3 border-b border-[rgba(31,77,71,0.1)] p-4 sm:flex-row sm:items-end sm:justify-between sm:p-5">
        <div><p className="text-sm font-medium text-[#66736f]">Recent scans</p><h2 className="mt-1 text-xl font-semibold text-[#183f3a]">Latest activity</h2></div>
        <Button asChild variant="outline" className="border-[#cfe2de] bg-white text-[#183f3a] hover:bg-[#eef4f2]"><Link href="/history">View all history</Link></Button>
      </header>

      {scans.length === 0 ? (
        <div className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between"><div><h3 className="font-medium text-[#183f3a]">No scans yet</h3><p className="mt-1 text-sm text-[#66736f]">Create your first job-specific CV analysis.</p></div><Button asChild className="bg-[#183f3a] text-white hover:bg-[#1f4d47]"><Link href="/scan">New scan</Link></Button></div>
      ) : (
        <div className="divide-y divide-[rgba(31,77,71,0.1)]">
          {scans.map((scan) => {
            const status = getStatus(scan.currentStatus);
            return (
              <article key={scan.id} className="grid gap-3 p-4 transition-colors hover:bg-[#f8f7f3] sm:grid-cols-[minmax(0,1fr)_8rem_8rem_auto] sm:items-center sm:px-5">
                <div className="min-w-0"><h3 className="truncate font-medium text-[#183f3a]">{scan.jobTitle ?? "Untitled scan"}</h3><p className="mt-1 text-xs text-[#66736f]">{formatDate(scan.createdAt)}</p></div>
                <div><Badge className={status.className}><status.Icon className="size-3" aria-hidden="true" />{status.label}</Badge></div>
                <div><p className="text-xs text-[#66736f]">Score</p><p className="mt-1 font-semibold tabular-nums text-[#183f3a]">{scan.finalScore === null ? "—" : Math.round(scan.finalScore)}{scan.finalScore === null ? "" : "%"}</p>{scan.finalLabel ? <p className="mt-0.5 truncate text-xs text-[#66736f]">{formatScoreLabel(scan.finalLabel)}</p> : null}</div>
                <Button asChild variant="ghost" className="h-10 justify-self-start px-0 text-[#183f3a] hover:bg-transparent hover:text-[#276948] sm:justify-self-end"><Link href={`/scan/${scan.id}`}>Open<ArrowUpRight className="size-4" aria-hidden="true" /></Link></Button>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}

function getStatus(status: ScanStatus) {
  if (status === "completed") return { label: "Completed", Icon: CheckCircle2, className: "bg-[#276948] text-white" };
  if (status === "failed") return { label: "Failed", Icon: XCircle, className: "border border-[#edcbc7] bg-[#fff4f2] text-[#8f3a32]" };
  if (IN_PROGRESS.has(status)) return { label: "In progress", Icon: Clock3, className: "border border-[#cfe2de] bg-[#eef4f2] text-[#1f4d47]" };
  return { label: "Deleted", Icon: XCircle, className: "bg-[#eef4f2] text-[#66736f]" };
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("en", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" }).format(new Date(value));
}
