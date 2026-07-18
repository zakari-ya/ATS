import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, FilePenLine, History, Plus, ShieldCheck } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AnalysisSummaryCard } from "@/features/feedback/components/analysis-summary-card";
import { AppliedCapsCard } from "@/features/feedback/components/applied-caps-card";
import { ResultEmptyState } from "@/features/feedback/components/result-empty-state";
import { ResultFailedState } from "@/features/feedback/components/result-failed-state";
import { RecommendationsSection } from "@/features/feedback/components/recommendations-section";
import { ScoreBreakdown } from "@/features/feedback/components/score-breakdown";
import { ScoreCard } from "@/features/feedback/components/score-card";
import { SkillMatchSection } from "@/features/feedback/components/skill-match-section";
import { DeleteScanButton } from "@/features/scan/components/delete-scan-button";
import {
  formatResultLabel,
  formatStatus,
} from "@/features/feedback/feedback-copy";
import {
  parseAppliedCaps,
  parseNumberValue,
  parseScoreBreakdown,
  parseSkillItems,
  parseTextArray,
  type FeedbackResultDetails,
  type FeedbackScanSummary,
  type ResultPageState,
} from "@/features/feedback/types";
import { createClient } from "@/lib/supabase/server";
import type { ScanLabel, ScanStatus } from "@/types/scan";

type ResultPageProps = {
  params: Promise<{
    scanId: string;
  }>;
};

type ScanRow = {
  id: string;
  user_id: string;
  job_title: string | null;
  current_status: ScanStatus;
  cv_storage_path: string | null;
  final_score: number | string | null;
  final_label: ScanLabel | null;
  created_at: string;
  completed_at: string | null;
};

type ScanResultRow = {
  scan_id: string;
  user_id: string;
  ai_validation_status: "pending" | "valid" | "invalid";
  cv_text_char_count: number | string | null;
  final_score: number | string | null;
  final_label: ScanLabel | null;
  score_breakdown: unknown;
  matched_skills: unknown;
  missing_required_skills: unknown;
  missing_preferred_skills: unknown;
  strong_points: unknown;
  weak_points: unknown;
  recommendations: unknown;
  applied_caps: unknown;
  error_code: string | null;
  error_message: string | null;
  updated_at: string;
};

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export default async function ScanResultPage({ params }: ResultPageProps) {
  const { scanId } = await params;

  if (!UUID_PATTERN.test(scanId)) {
    notFound();
  }

  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect("/login");
  }

  const { data: scanRow, error: scanError } = await supabase
    .from("scans")
    .select(
      "id, user_id, job_title, current_status, cv_storage_path, final_score, final_label, created_at, completed_at"
    )
    .eq("id", scanId)
    .eq("user_id", user.id)
    .maybeSingle<ScanRow>();

  if (scanError || !scanRow || scanRow.user_id !== user.id) {
    notFound();
  }

  const scan = normalizeScan(scanRow);
  const { data: resultRow } = await supabase
    .from("scan_results")
    .select(
      [
        "scan_id",
        "user_id",
        "ai_validation_status",
        "cv_text_char_count",
        "final_score",
        "final_label",
        "score_breakdown",
        "matched_skills",
        "missing_required_skills",
        "missing_preferred_skills",
        "strong_points",
        "weak_points",
        "recommendations",
        "applied_caps",
        "error_code",
        "error_message",
        "updated_at",
      ].join(", ")
    )
    .eq("scan_id", scanId)
    .eq("user_id", user.id)
    .maybeSingle<ScanResultRow>();

  const result =
    resultRow && resultRow.user_id === user.id
      ? normalizeResult(resultRow)
      : null;
  const pageState = buildPageState(scan, result);

  return (
    <div className="app-section-enter flex min-h-full flex-col gap-4 lg:h-full lg:min-h-0">
      <ResultHeader scan={scan} />

      {pageState.kind === "ready" ? (
        <div className="grid gap-4 lg:min-h-0 lg:flex-1 xl:grid-cols-12">
          <aside className="grid content-start gap-4 xl:col-span-4">
            <ScoreCard scan={pageState.scan} result={pageState.result} />
            <TailoredResumeAction scanId={pageState.scan.id} />
            <ScoreBreakdown breakdown={pageState.result.scoreBreakdown} />
            <AppliedCapsCard appliedCaps={pageState.result.appliedCaps} />
            <Disclaimer />
          </aside>
          <section className="min-h-0 space-y-4 overflow-visible xl:col-span-8 xl:overflow-auto">
            <AnalysisSummaryCard result={pageState.result} />
            <SkillMatchSection
              title="Matched skills and requirements"
              description="Evidence the analysis found in your CV."
              emptyMessage="No matched requirements were returned for this analysis."
              items={pageState.result.matchedSkills}
              variant="matched"
            />
            <SkillMatchSection
              title="Missing required skills"
              description="Required or critical items from the job post that were not visible in the CV."
              emptyMessage="No missing required skills were found in this analysis."
              items={pageState.result.missingRequiredSkills}
              variant="missing-required"
            />
            <SkillMatchSection
              title="Missing preferred skills"
              description="Optional items that could make the CV more aligned if they are true to your experience."
              emptyMessage="No missing preferred skills were found in this analysis."
              items={pageState.result.missingPreferredSkills}
              variant="missing-preferred"
            />
            <RecommendationsSection
              strongPoints={pageState.result.strongPoints}
              weakPoints={pageState.result.weakPoints}
              recommendations={pageState.result.recommendations}
            />
          </section>
        </div>
      ) : (
        pageState.kind === "failed" ? (
          <ResultFailedState
            scanId={pageState.scan.id}
            title={pageState.title}
            message={pageState.message}
            canRetry={Boolean(pageState.retryAvailable)}
          />
        ) : (
          <ResultEmptyState
            title={pageState.title}
            message={pageState.message}
            statusLabel={pageState.statusLabel}
            currentStatus={pageState.scan.currentStatus}
          />
        )
      )}
    </div>
  );
}

function TailoredResumeAction({ scanId }: { scanId: string }) {
  return (
    <section className="rounded-2xl border border-[#cfe2de] bg-[#eef4f2] p-4">
      <FilePenLine className="size-5 text-[#315c45]" aria-hidden="true" />
      <h2 className="mt-3 text-base font-semibold text-[#183f3a]">
        Create a tailored resume
      </h2>
      <p className="mt-1 text-sm leading-6 text-[#315c45]">
        Build a job-specific resume using your existing CV, verified experience,
        and this scan&apos;s analysis.
      </p>
      <Button asChild className="mt-4 h-10 w-full bg-[#183f3a] text-white hover:bg-[#1f4d47]">
        <Link href={`/scan/${scanId}/resume`}>
          Create tailored resume
          <FilePenLine className="size-4" aria-hidden="true" />
        </Link>
      </Button>
    </section>
  );
}

function ResultHeader({ scan }: { scan: FeedbackScanSummary }) {
  return (
    <section className="rounded-2xl border border-[rgba(31,77,71,0.12)] bg-white p-4 shadow-sm shadow-[#183f3a]/5">
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
        <div className="min-w-0 space-y-3">
          <Button
            asChild
            variant="ghost"
            className="h-8 w-fit rounded-xl px-0 text-[#66736f] hover:bg-transparent hover:text-[#183f3a]"
          >
            <Link href="/dashboard">
              <ArrowLeft className="size-4" aria-hidden="true" />
              Back to Dashboard
            </Link>
          </Button>
          <div className="space-y-3">
            <div className="flex flex-wrap gap-2">
              <Badge className="bg-[#183f3a] text-white capitalize">
                {formatStatus(scan.currentStatus)}
              </Badge>
              <Badge
                variant="outline"
                className="border-[rgba(31,77,71,0.12)] bg-[#eef4f2] text-[#183f3a]"
              >
                {formatResultLabel(scan.finalLabel)}
              </Badge>
            </div>
            <h1 className="truncate text-2xl font-semibold tracking-tight text-[#183f3a] md:text-3xl">
              {scan.jobTitle ?? "CV match result"}
            </h1>
            <p className="text-sm leading-6 text-[#66736f]">
              Review the score, matched evidence, missing requirements, and
              practical CV improvements from this scan.
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row lg:justify-end">
          <Button
            asChild
            className="h-10 rounded-xl bg-[#183f3a] px-4 text-white hover:bg-[#1f4d47]"
          >
            <Link href="/scan">
              <Plus className="size-4" aria-hidden="true" />
              New Scan
            </Link>
          </Button>
          <Button
            asChild
            variant="outline"
            className="h-10 rounded-xl border-[rgba(31,77,71,0.14)] bg-white px-4 text-[#183f3a] hover:bg-[#eef4f2]"
          >
            <Link href="/history">
              <History className="size-4" aria-hidden="true" />
              History
            </Link>
          </Button>
          <DeleteScanButton
            scanId={scan.id}
            redirectTo="/history"
            className="h-10 rounded-xl border-[#edcbc7] bg-white px-4 text-[#8f3a32] hover:bg-[#fff4f2]"
            size="default"
            variant="outline"
          />
        </div>
      </div>
    </section>
  );
}

function Disclaimer() {
  return (
    <Alert className="border-[#cfe2de] bg-[#eef4f2] p-4 text-[#315c45]">
      <ShieldCheck className="size-4" aria-hidden="true" />
      <AlertTitle>ATS-style guidance</AlertTitle>
      <AlertDescription className="leading-6 text-[#315c45]">
        This analysis compares your CV with one job post. It is guidance for CV
        readiness, not a hiring decision system.
      </AlertDescription>
    </Alert>
  );
}

function normalizeScan(scan: ScanRow): FeedbackScanSummary {
  return {
    id: scan.id,
    jobTitle: scan.job_title,
    currentStatus: scan.current_status,
    hasStoredCv: Boolean(scan.cv_storage_path),
    finalScore: parseNumberValue(scan.final_score),
    finalLabel: scan.final_label,
    createdAt: scan.created_at,
    completedAt: scan.completed_at,
  };
}

function normalizeResult(result: ScanResultRow): FeedbackResultDetails {
  return {
    aiValidationStatus: result.ai_validation_status,
    cvTextCharCount: parseNumberValue(result.cv_text_char_count),
    finalScore: parseNumberValue(result.final_score),
    finalLabel: result.final_label,
    scoreBreakdown: parseScoreBreakdown(result.score_breakdown),
    matchedSkills: parseSkillItems(result.matched_skills),
    missingRequiredSkills: parseSkillItems(result.missing_required_skills),
    missingPreferredSkills: parseSkillItems(result.missing_preferred_skills),
    strongPoints: parseTextArray(result.strong_points),
    weakPoints: parseTextArray(result.weak_points),
    recommendations: parseTextArray(result.recommendations),
    appliedCaps: parseAppliedCaps(result.applied_caps),
    errorCode: result.error_code,
    errorMessage: result.error_message,
    updatedAt: result.updated_at,
  };
}

function buildPageState(
  scan: FeedbackScanSummary,
  result: FeedbackResultDetails | null
): ResultPageState {
  const retryAvailable = Boolean(result?.cvTextCharCount || scan.hasStoredCv);

  if (scan.currentStatus === "failed") {
    return {
      kind: "failed",
      scan,
      result,
      title: "The analysis could not be completed",
      message: getFailedResultMessage(result),
      statusLabel: "Failed scan",
      retryAvailable,
    };
  }

  if (!result) {
    return {
      kind: "missing_result",
      scan,
      result: null,
      title: "We could not find this scan result",
      message:
        "The scan exists, but the detailed result is not available yet. Try refreshing in a moment.",
      statusLabel: "Result unavailable",
    };
  }

  if (result.aiValidationStatus === "invalid") {
    return {
      kind: "failed",
      scan,
      result,
      title: "The analysis could not be validated safely",
      message: getFailedResultMessage(result),
      statusLabel: "Failed scan",
      retryAvailable,
    };
  }

  const finalScore = scan.finalScore ?? result.finalScore;
  const finalLabel = scan.finalLabel ?? result.finalLabel;

  if (scan.currentStatus === "created" || scan.currentStatus === "uploading" || scan.currentStatus === "uploaded") {
    return {
      kind: "not_ready",
      scan,
      result,
      title: "Your scan is being prepared.",
      message:
        "We have your scan details and private upload. The next server steps will continue automatically when the inputs are ready.",
      statusLabel: "Preparing scan",
    };
  }

  if (scan.currentStatus === "extracting_text") {
    return {
      kind: "not_ready",
      scan,
      result,
      title: "We are reading your CV.",
      message:
        "The server is extracting readable text from your PDF before analysis starts.",
      statusLabel: "Reading CV",
    };
  }

  if (scan.currentStatus === "analyzing" || scan.currentStatus === "scoring") {
    return {
      kind: "not_ready",
      scan,
      result,
      title: "We are comparing your CV with the job post.",
      message:
        "The AI analysis and backend scoring are still running. Refresh shortly to see the completed result.",
      statusLabel: "Analysis in progress",
    };
  }

  if (
    scan.currentStatus !== "completed" ||
    result.aiValidationStatus !== "valid" ||
    finalScore === null ||
    !finalLabel
  ) {
    return {
      kind: "not_ready",
      scan,
      result,
      title: "This analysis is still being prepared",
      message:
        "The score and feedback will appear after analysis and backend scoring finish.",
      statusLabel: "Preparing analysis",
    };
  }

  return {
    kind: "ready",
    scan: {
      ...scan,
      finalScore,
      finalLabel,
    },
    result: {
      ...result,
      finalScore,
      finalLabel,
      scoreBreakdown: {
        ...result.scoreBreakdown,
        finalScore: result.scoreBreakdown.finalScore ?? finalScore,
      },
    },
  };
}

function getFailedResultMessage(result: FeedbackResultDetails | null): string {
  return (
    result?.errorMessage ??
    "The analysis failed. Please try again with a clean text-based CV PDF."
  );
}
