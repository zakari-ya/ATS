import { ScanHistoryCard } from "@/features/scan/components/scan-history-card";
import { ScanHistoryEmptyState } from "@/features/scan/components/scan-history-empty-state";
import type { ScanHistoryItem } from "@/features/scan/types";

type ScanHistoryListProps = {
  scans: ScanHistoryItem[];
};

export function ScanHistoryList({ scans }: ScanHistoryListProps) {
  if (scans.length === 0) {
    return <ScanHistoryEmptyState />;
  }

  return (
    <div className="grid gap-3 xl:grid-cols-2 2xl:grid-cols-3">
      {scans.map((scan) => (
        <ScanHistoryCard key={scan.id} scan={scan} />
      ))}
    </div>
  );
}
