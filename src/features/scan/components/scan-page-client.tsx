"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, FileText, Loader2, ShieldCheck, Sparkles } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { createAppError } from "@/lib/errors/app-error";
import { createErrorResult } from "@/lib/errors/safe-action-result";
import { CvUploadCard } from "@/features/scan/components/cv-upload-card";
import { JobDescriptionForm } from "@/features/scan/components/job-description-form";
import { ScanSubmitCard } from "@/features/scan/components/scan-submit-card";
import {
  analyzeCvMatchForScan,
  createScanWithCvUpload,
  extractCvTextForScan,
} from "@/features/scan/actions";
import type {
  AnalyzeCvMatchActionResult,
  CreateScanUploadResult,
  ExtractCvTextResult,
  ScanFormUiState,
  ScanSubmitStage,
} from "@/features/scan/types";
import { UsageLimitAlert } from "@/features/usage/components/usage-limit-alert";
import { UsageQuotaCard } from "@/features/usage/components/usage-quota-card";
import {
  validateCvFileForUi,
  validateJobDescriptionForUi,
} from "@/features/scan/validators";
import type { TodayUsageSummary } from "@/types/usage";

type ScanPageClientProps = {
  todayUsage: TodayUsageSummary;
};

function getQuotaBlockMessage(usage: TodayUsageSummary): string | null {
  if (usage.isAiLimitReached) {
    return "You reached your daily analysis limit. Please try again tomorrow.";
  }

  if (usage.isScanLimitReached) {
    return "You reached your daily scan limit. Please try again tomorrow.";
  }

  if (usage.isUploadLimitReached) {
    return "You reached your daily upload limit. Please try again tomorrow.";
  }

  return null;
}

function getPrimaryActionLabel(stage: ScanSubmitStage, canSubmit: boolean) {
  if (stage === "analyzing") {
    return "Analyzing match";
  }

  if (stage === "extracting") {
    return "Reading CV";
  }

  if (stage === "uploading") {
    return "Uploading CV";
  }

  return canSubmit ? "Start analysis" : "Add CV and job post";
}

export function ScanPageClient({ todayUsage }: ScanPageClientProps) {
  const router = useRouter();
  const [formState, setFormState] = useState<ScanFormUiState>({
    cvFile: null,
    jobDescription: "",
  });
  const [result, setResult] = useState<
    | CreateScanUploadResult
    | ExtractCvTextResult
    | AnalyzeCvMatchActionResult
    | null
  >(null);
  const [submitStage, setSubmitStage] = useState<ScanSubmitStage>("idle");
  const [isPending, startTransition] = useTransition();
  const cvValidation = useMemo(
    () => validateCvFileForUi(formState.cvFile?.file ?? null),
    [formState.cvFile]
  );
  const jobDescriptionValidation = useMemo(
    () => validateJobDescriptionForUi(formState.jobDescription),
    [formState.jobDescription]
  );
  const quotaBlockMessage = getQuotaBlockMessage(todayUsage);
  const canSubmit =
    cvValidation.valid &&
    jobDescriptionValidation.valid &&
    quotaBlockMessage === null;
  const isWorking = isPending || submitStage !== "idle";
  const primaryActionLabel = getPrimaryActionLabel(submitStage, canSubmit);

  function handleSubmit() {
    if (!canSubmit || !formState.cvFile) {
      return;
    }

    setResult(null);

    const submitFormData = new FormData();
    submitFormData.append("cvFile", formState.cvFile.file);
    submitFormData.append("jobDescription", formState.jobDescription);

    startTransition(() => {
      void (async () => {
        try {
          setSubmitStage("uploading");
          const uploadResult = await createScanWithCvUpload(submitFormData);

          if (!uploadResult.ok) {
            setResult(uploadResult);
            setSubmitStage("idle");
            return;
          }

          setSubmitStage("extracting");
          const extractionResult = await extractCvTextForScan(
            uploadResult.data.scanId
          );

          if (!extractionResult.ok) {
            setResult(extractionResult);
            setSubmitStage("idle");
            return;
          }

          setSubmitStage("analyzing");
          const analysisResult = await analyzeCvMatchForScan(
            extractionResult.data.scanId
          );
          setResult(analysisResult);

          if (analysisResult.ok) {
            setFormState({
              cvFile: null,
              jobDescription: "",
            });
            router.push(`/scan/${analysisResult.data.scanId}`);
            return;
          }
        } catch {
          setResult(
            createErrorResult(
              createAppError(
                "DATABASE_WRITE_FAILED",
                "The scan could not be processed. Please try again."
              )
            )
          );
        } finally {
          setSubmitStage("idle");
        }
      })();
    });
  }

  return (
    <div className="app-section-enter flex min-h-full flex-col gap-4 pb-20 lg:h-full lg:min-h-0 lg:pb-0">
      <section className="rounded-xl bg-white p-4 sm:p-5">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="space-y-2">
            <Badge className="w-fit border border-[rgba(31,77,71,0.12)] bg-[#eef4f2] text-[#183f3a]">
              <Sparkles className="size-3.5" aria-hidden="true" />
              New scan
            </Badge>
            <div>
              <h1 className="text-2xl font-semibold tracking-tight text-[#183f3a] md:text-3xl">
                Prepare a focused CV match analysis.
              </h1>
              <p className="mt-1 text-sm leading-6 text-[#66736f]">
                Upload your CV and paste the job post. We compare both and show
                what matches, what is missing, and what to improve before
                applying.
              </p>
            </div>
          </div>
          <div className="hidden w-full flex-col gap-2 sm:w-auto sm:min-w-64 md:flex">
            <div className="flex items-center justify-between gap-2 rounded-2xl border border-[rgba(31,77,71,0.12)] bg-[#eef4f2] px-3 py-2 text-sm text-[#365a54]">
              <span className="font-medium text-[#183f3a]">
                {todayUsage.remainingAiRequests} analyses left
              </span>
              <span className="text-xs">Resets daily</span>
            </div>
            <Button
              type="button"
              disabled={!canSubmit || isWorking}
              onClick={handleSubmit}
              className="h-12 rounded-2xl bg-[#183f3a] text-white shadow-sm shadow-[#183f3a]/15 hover:bg-[#1f4d47] disabled:cursor-not-allowed disabled:opacity-55"
            >
              {isWorking ? (
                <Loader2 className="size-4 animate-spin" aria-hidden="true" />
              ) : (
                <ShieldCheck className="size-4" aria-hidden="true" />
              )}
              {primaryActionLabel}
            </Button>
            {quotaBlockMessage ? (
              <p className="text-xs leading-5 text-[#8a5a1f]">
                {quotaBlockMessage}
              </p>
            ) : null}
          </div>
        </div>
      </section>

      <ScanStepIndicator
        hasCv={cvValidation.valid}
        hasJobPost={jobDescriptionValidation.valid}
        isWorking={isWorking}
      />

      <section className="grid items-start gap-4 lg:min-h-0 lg:flex-1 xl:grid-cols-12">
        <div className="grid min-h-0 content-start gap-4 xl:col-span-8">
          <CvUploadCard
            selectedFile={formState.cvFile}
            onSelectedFileChange={(cvFile) => {
              setResult(null);
              setFormState((currentState) => ({
                ...currentState,
                cvFile,
              }));
            }}
          />
          <JobDescriptionForm
            value={formState.jobDescription}
            onValueChange={(jobDescription) => {
              setResult(null);
              setFormState((currentState) => ({
                ...currentState,
                jobDescription,
              }));
            }}
          />
        </div>

        <aside className="grid content-start gap-4 xl:col-span-4">
          <UsageQuotaCard usage={todayUsage} variant="compact" />
          <UsageLimitAlert usage={todayUsage} />
          <div className="rounded-2xl border border-[rgba(31,77,71,0.12)] bg-[#183f3a] p-4 text-white shadow-sm shadow-[#183f3a]/15">
            <div className="flex items-center justify-between gap-3">
              <div className="flex size-10 items-center justify-center rounded-2xl bg-white text-[#183f3a]">
                <FileText className="size-5" aria-hidden="true" />
              </div>
              <Badge className="bg-white/12 text-white">Private upload</Badge>
            </div>
            <p className="mt-4 text-sm leading-6 text-white/70">
              This creates a private scan, uploads the CV, extracts readable
              text, validates AI JSON, and calculates the score in backend code.
            </p>
            <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
              <div className="rounded-2xl border border-white/10 bg-white/[0.06] p-3">
                <p className="text-white/48">File</p>
                <p className="mt-1 font-medium">PDF, 5 MB max</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/[0.06] p-3">
                <p className="text-white/48">Job post</p>
                <p className="mt-1 font-medium">30-20k chars</p>
              </div>
            </div>
          </div>
          <div className="hidden xl:block">
            <ScanSubmitCard
              canSubmit={canSubmit}
              isPending={isPending}
              stage={submitStage}
              result={result}
              onSubmit={handleSubmit}
              submitBlockedMessage={quotaBlockMessage}
            />
          </div>
        </aside>
      </section>

      <div className="fixed inset-x-3 bottom-[calc(5.65rem+env(safe-area-inset-bottom))] z-40 rounded-xl bg-[#183f3a] p-2 shadow-lg shadow-[#183f3a]/18 lg:hidden">
        <div className="flex items-center gap-2">
          <div className="min-w-0 flex-1 px-2">
            <p className="text-xs font-medium text-white">{todayUsage.remainingAiRequests} analyses left today</p>
            <p className="truncate text-[0.68rem] text-white/58">PDF + job post required</p>
          </div>
          <Button
            type="button"
            disabled={!canSubmit || isWorking}
            onClick={handleSubmit}
            className="h-11 shrink-0 bg-white px-4 text-[#183f3a] hover:bg-[#eef4f2] disabled:opacity-50"
          >
            {isWorking ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : <ShieldCheck className="size-4" aria-hidden="true" />}
            {primaryActionLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}

function ScanStepIndicator({ hasCv, hasJobPost, isWorking }: { hasCv: boolean; hasJobPost: boolean; isWorking: boolean }) {
  const steps = [
    { label: "Add CV", complete: hasCv },
    { label: "Add job post", complete: hasJobPost },
    { label: "Review and scan", complete: isWorking },
  ];

  return (
    <ol className="grid grid-cols-3 overflow-hidden rounded-xl bg-[#eef4f2]" aria-label="Scan setup steps">
      {steps.map((step, index) => (
        <li key={step.label} className="flex min-w-0 items-center gap-2 border-r border-[#cfe2de] px-3 py-3 last:border-r-0 sm:px-4">
          <span className={[
            "flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold",
            step.complete ? "bg-[#183f3a] text-white" : "bg-white text-[#66736f]",
          ].join(" ")}>
            {step.complete ? <Check className="size-3.5" aria-hidden="true" /> : index + 1}
          </span>
          <span className="truncate text-xs font-medium text-[#365a54] sm:text-sm">{step.label}</span>
        </li>
      ))}
    </ol>
  );
}
