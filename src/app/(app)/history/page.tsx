import Link from "next/link";
import { redirect } from "next/navigation";
import { AlertCircle, Plus } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { HISTORY_SCAN_LIMIT } from "@/features/scan/constants";
import { ScanHistoryList } from "@/features/scan/components/scan-history-list";
import type { ScanHistoryItem } from "@/features/scan/types";
import { createClient } from "@/lib/supabase/server";
import type { ScanLabel, ScanStatus } from "@/types/scan";

type ScanHistoryRow = {
  id: string;
  job_title: string | null;
  current_status: ScanStatus;
  final_score: number | string | null;
  final_label: ScanLabel | null;
  created_at: string;
  completed_at: string | null;
};

export default async function HistoryPage() {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect("/login");
  }

  const { data: scanRows, error: scansError } = await supabase
    .from("scans")
    .select(
      "id, job_title, current_status, final_score, final_label, created_at, completed_at"
    )
    .eq("user_id", user.id)
    .neq("current_status", "deleted")
    .order("created_at", { ascending: false })
    .limit(HISTORY_SCAN_LIMIT)
    .returns<ScanHistoryRow[]>();

  const scans = (scanRows ?? []).map(normalizeScanHistoryRow);

  return (
    <div className="app-section-enter flex min-h-full flex-col gap-4 lg:min-h-0">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="min-w-0 space-y-2">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight text-[#183f3a] md:text-3xl">
                Scan history
              </h1>
              <p className="mt-1 text-sm leading-6 text-[#66736f]">Search, compare, and revisit the latest {HISTORY_SCAN_LIMIT} lightweight scan summaries.</p>
            </div>
          </div>

          <Button
            asChild
            className="h-10 rounded-xl bg-[#183f3a] px-4 text-white hover:bg-[#1f4d47]"
          >
            <Link href="/scan">
              <Plus className="size-4" aria-hidden="true" />
              New Scan
            </Link>
          </Button>
        </div>
      </header>

      {scansError ? (
        <Alert className="border-[#f0c8c8] bg-[#fff7f7] text-[#8a2d2d]">
          <AlertCircle className="size-4" aria-hidden="true" />
          <AlertTitle>History could not be loaded</AlertTitle>
          <AlertDescription className="leading-6 text-[#8a2d2d]">
            Try refreshing the page. Your private scan data was not exposed.
          </AlertDescription>
        </Alert>
      ) : (
        <div className="lg:min-h-0 lg:flex-1">
          <ScanHistoryList scans={scans} />
        </div>
      )}
    </div>
  );
}

function normalizeScanHistoryRow(scan: ScanHistoryRow): ScanHistoryItem {
  return {
    id: scan.id,
    jobTitle: scan.job_title,
    currentStatus: scan.current_status,
    finalScore: parseNumberValue(scan.final_score),
    finalLabel: scan.final_label,
    createdAt: scan.created_at,
    completedAt: scan.completed_at,
  };
}

function parseNumberValue(value: number | string | null): number | null {
  const parsedValue =
    typeof value === "number" ? value : value === null ? null : Number(value);

  return typeof parsedValue === "number" && Number.isFinite(parsedValue)
    ? parsedValue
    : null;
}

// TODO: Add cursor or range-based pagination after the first 20-scan version.
