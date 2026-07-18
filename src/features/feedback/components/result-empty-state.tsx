import Link from "next/link";
import { History, Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { ScanProgressTimeline } from "@/features/scan/components/scan-progress-timeline";
import type { ScanStatus } from "@/types/scan";

export function ResultEmptyState({
  title,
  message,
  statusLabel,
  currentStatus,
}: {
  title: string;
  message: string;
  statusLabel: string;
  currentStatus: ScanStatus;
}) {
  return (
    <section className="grid items-start gap-4 lg:grid-cols-[minmax(0,0.8fr)_minmax(20rem,1.2fr)]">
      <div className="flex flex-col justify-between rounded-xl bg-[#183f3a] p-6 text-white">
        <div>
          <p className="text-sm font-medium text-[#b9d4ce]">{statusLabel}</p>
          <h2 className="mt-3 text-2xl font-semibold">{title}</h2>
          <p className="mt-3 text-sm leading-6 text-white/70">{message}</p>
        </div>
        <div className="mt-8 flex flex-col gap-2 sm:flex-row lg:flex-col xl:flex-row">
          <Button asChild className="bg-white text-[#183f3a] hover:bg-[#eef4f2]"><Link href="/scan"><Plus className="size-4" aria-hidden="true" />New scan</Link></Button>
          <Button asChild variant="ghost" className="text-white hover:bg-white/8 hover:text-white"><Link href="/history"><History className="size-4" aria-hidden="true" />History</Link></Button>
        </div>
      </div>
      <div className="rounded-xl bg-white p-5 sm:p-6">
        <h3 className="text-lg font-semibold text-[#183f3a]">Analysis progress</h3>
        <p className="mt-1 text-sm leading-6 text-[#66736f]">Steps reflect the current stored scan status. No simulated percentages are used.</p>
        <ScanProgressTimeline currentStatus={currentStatus} />
      </div>
    </section>
  );
}
