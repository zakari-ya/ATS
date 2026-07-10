import { Check, Circle, Loader2 } from "lucide-react";

import type { ScanStatus } from "@/types/scan";

const steps: Array<{ status: ScanStatus; label: string; detail: string }> = [
  { status: "uploaded", label: "Upload secured", detail: "Your PDF is stored privately." },
  { status: "extracting_text", label: "Reading your CV", detail: "Extracting selectable PDF text." },
  { status: "analyzing", label: "Comparing requirements", detail: "Analyzing CV evidence against the job post." },
  { status: "scoring", label: "Validating and scoring", detail: "Validating structured output and calculating the backend score." },
  { status: "completed", label: "Preparing your results", detail: "Saving the trusted result to your account." },
];

const statusOrder: Record<ScanStatus, number> = {
  created: 0,
  uploading: 0,
  uploaded: 1,
  validating_file: 1,
  extracting_text: 2,
  analyzing: 3,
  scoring: 4,
  completed: 5,
  failed: 0,
  deleted: 0,
};

export function ScanProgressTimeline({ currentStatus }: { currentStatus: ScanStatus }) {
  const currentIndex = statusOrder[currentStatus];

  return (
    <ol className="mt-6 space-y-0" aria-label="Scan progress">
      {steps.map((step, index) => {
        const stepNumber = index + 1;
        const isComplete = currentIndex > stepNumber;
        const isActive = currentIndex === stepNumber;

        return (
          <li key={step.status} className="relative flex gap-4 pb-5 last:pb-0">
            {index < steps.length - 1 ? (
              <span className="absolute left-[15px] top-8 h-[calc(100%-1rem)] w-px bg-[#cfe2de]" aria-hidden="true" />
            ) : null}
            <span className={[
              "relative z-10 flex size-8 shrink-0 items-center justify-center rounded-full",
              isComplete ? "bg-[#276948] text-white" : isActive ? "bg-[#183f3a] text-white" : "bg-[#dcebea] text-[#66736f]",
            ].join(" ")}>
              {isComplete ? <Check className="size-4" aria-hidden="true" /> : isActive ? <Loader2 className="size-4 animate-spin motion-reduce:animate-none" aria-hidden="true" /> : <Circle className="size-3" aria-hidden="true" />}
            </span>
            <div className="pt-1">
              <p className={isComplete || isActive ? "text-sm font-medium text-[#183f3a]" : "text-sm font-medium text-[#71807c]"}>{step.label}</p>
              <p className="mt-1 text-sm leading-5 text-[#66736f]">{step.detail}</p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
