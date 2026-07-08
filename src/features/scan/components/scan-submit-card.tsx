import {
  AlertCircle,
  Calculator,
  CheckCircle2,
  FileSearch,
  Loader2,
  LockKeyhole,
  Sparkles,
} from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getSafeErrorMessage } from "@/lib/errors/app-error";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type {
  AnalyzeCvMatchActionResult,
  CreateScanUploadResult,
  ExtractCvTextResult,
  ScanSubmitStage,
} from "@/features/scan/types";

const analysisSteps = [
  {
    title: "Secure file validation",
    description: "The server will verify the PDF before reading it.",
    icon: LockKeyhole,
  },
  {
    title: "CV text extraction",
    description: "The PDF text will be read in a controlled server flow.",
    icon: FileSearch,
  },
  {
    title: "AI comparison",
    description: "The CV and job post will be compared as untrusted content.",
    icon: Sparkles,
  },
  {
    title: "Backend score calculation",
    description: "The final score will be calculated by code, not by AI.",
    icon: Calculator,
  },
];

type ScanSubmitCardProps = {
  canSubmit: boolean;
  isPending: boolean;
  stage: ScanSubmitStage;
  result:
    | CreateScanUploadResult
      | ExtractCvTextResult
      | AnalyzeCvMatchActionResult
      | null;
  onSubmit: () => void;
  submitBlockedMessage?: string | null;
  variant?: "default" | "compact";
};

type FailedScanSubmitResult = Extract<
  CreateScanUploadResult | ExtractCvTextResult | AnalyzeCvMatchActionResult,
  { ok: false }
>;

function getResultMessage(
  result: FailedScanSubmitResult
): string {
  if (
    result.error.code === "DAILY_AI_LIMIT_REACHED" ||
    result.error.code === "DAILY_SCAN_LIMIT_REACHED" ||
    result.error.code === "DAILY_UPLOAD_LIMIT_REACHED"
  ) {
    return getSafeErrorMessage(result.error.code);
  }

  return result.error.message;
}

export function ScanSubmitCard({
  canSubmit,
  isPending,
  stage,
  result,
  onSubmit,
  submitBlockedMessage,
  variant = "default",
}: ScanSubmitCardProps) {
  const isCompact = variant === "compact";
  const isWorking = isPending || stage !== "idle";
  const buttonLabel =
    stage === "analyzing"
      ? "Analyzing match"
      : stage === "extracting"
      ? "Extracting CV text"
      : stage === "uploading"
        ? "Uploading CV"
        : "Start analysis";
  const isSubmitBlocked = Boolean(submitBlockedMessage);

  return (
    <Card
      className={[
        "border-[#2a625b] bg-[#183f3a] text-white shadow-sm shadow-[#183f3a]/15",
        isCompact ? "" : "xl:sticky xl:top-4",
      ].join(" ")}
    >
      <CardHeader className="gap-3 p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex size-10 items-center justify-center rounded-2xl bg-white text-[#183f3a]">
            <Sparkles className="size-5" aria-hidden="true" />
          </div>
          <Badge className="bg-white/12 text-white">Pipeline</Badge>
        </div>
        <div className="space-y-2">
          <CardTitle className="text-xl font-semibold tracking-tight">
            {isCompact ? "Ready to analyze" : "Secure upload"}
          </CardTitle>
          <CardDescription className="text-sm leading-6 text-white/68">
            {isCompact
              ? "Start the private scan flow as soon as your CV and job post are ready."
              : "Create a scan, upload the CV privately, and prepare the next analysis step with validated AI JSON and backend scoring."}
          </CardDescription>
        </div>
      </CardHeader>

      <CardContent className="space-y-4 p-4 pt-0">
        {isCompact ? (
          <div className="grid gap-2 sm:grid-cols-2">
            {analysisSteps.map((step) => {
              const Icon = step.icon;

              return (
                <div
                  key={step.title}
                  className="rounded-2xl border border-white/10 bg-white/[0.06] p-3"
                >
                  <div className="flex items-start gap-3">
                    <div className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-white/10 text-[#f4dfb6]">
                      <Icon className="size-4" aria-hidden="true" />
                    </div>
                    <div>
                      <h2 className="text-sm font-medium leading-5">
                        {step.title}
                      </h2>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="space-y-2">
            {analysisSteps.map((step) => {
              const Icon = step.icon;

              return (
                <div
                  key={step.title}
                  className="rounded-2xl border border-white/10 bg-white/[0.06] p-3"
                >
                  <div className="flex gap-3">
                    <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-white/10 text-[#f4dfb6]">
                      <Icon className="size-4" aria-hidden="true" />
                    </div>
                    <div>
                      <h2 className="text-sm font-medium">{step.title}</h2>
                      <p className="mt-1 text-sm leading-5 text-white/62">
                        {step.description}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <Button
          type="button"
          disabled={!canSubmit || isWorking || isSubmitBlocked}
          onClick={onSubmit}
          className="h-11 w-full rounded-xl bg-white text-[#183f3a] hover:bg-[#eef4f2] disabled:cursor-not-allowed disabled:opacity-55"
        >
          {isWorking ? (
            <>
              <Loader2 className="size-4 animate-spin" aria-hidden="true" />
              {buttonLabel}
            </>
          ) : (
            buttonLabel
          )}
        </Button>

        <p className="text-center text-xs leading-5 text-white/54">
          {isCompact
            ? "The final score is calculated by backend code."
            : "AI analyzes the evidence. The backend validates JSON and calculates the score."}
        </p>

        {submitBlockedMessage ? (
          <Alert className="border-[#f0d7c5] bg-[#fffaf4] text-[#8b5e27]">
            <AlertCircle className="size-4" aria-hidden="true" />
            <AlertTitle>Analysis unavailable for today</AlertTitle>
            <AlertDescription className="text-[#8b5e27]">
              {submitBlockedMessage}
            </AlertDescription>
          </Alert>
        ) : null}

        {result?.ok ? (
          <Alert className="border-[#b9dec9] bg-[#effaf4] text-[#17623a]">
            <CheckCircle2 className="size-4" aria-hidden="true" />
            <AlertTitle>Analysis ready</AlertTitle>
            <AlertDescription className="text-[#276948]">
              {result.data.message}
            </AlertDescription>
          </Alert>
        ) : null}

        {result && !result.ok ? (
          <Alert className="border-[#f0c8c8] bg-[#fff7f7] text-[#8a2d2d]">
            <AlertCircle className="size-4" aria-hidden="true" />
            <AlertTitle>Scan issue</AlertTitle>
            <AlertDescription className="text-[#8a2d2d]">
              {getResultMessage(result)}
              {process.env.NODE_ENV === "development" ? (
                <span className="mt-2 block font-mono text-xs">
                  Error code: {result.error.code}
                </span>
              ) : null}
            </AlertDescription>
          </Alert>
        ) : null}
      </CardContent>
    </Card>
  );
}
