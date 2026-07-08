"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, Loader2, RotateCw } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { retryFailedScanAction } from "@/features/scan/actions";
import type { RetryScanActionResult } from "@/features/scan/types";
import { cn } from "@/lib/utils";

type RetryScanButtonProps = {
  scanId: string;
  className?: string;
};

export function RetryScanButton({
  scanId,
  className,
}: RetryScanButtonProps) {
  const router = useRouter();
  const [result, setResult] = useState<RetryScanActionResult | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleRetry() {
    setResult(null);

    startTransition(() => {
      void (async () => {
        const retryResult = await retryFailedScanAction(scanId);
        setResult(retryResult);

        if (retryResult.ok) {
          router.refresh();
        }
      })();
    });
  }

  return (
    <div className={cn("space-y-3", className)}>
      <Button
        type="button"
        onClick={handleRetry}
        disabled={isPending}
        className="h-11 rounded-xl bg-[#183f3a] px-4 text-white hover:bg-[#1f4d47]"
      >
        {isPending ? (
          <>
            <Loader2 className="size-4 animate-spin" aria-hidden="true" />
            Retrying
          </>
        ) : (
          <>
            <RotateCw className="size-4" aria-hidden="true" />
            Retry scan
          </>
        )}
      </Button>

      {result && !result.ok ? (
        <Alert className="border-[#f0c8c8] bg-[#fff7f7] text-[#8a2d2d]">
          <AlertCircle className="size-4" aria-hidden="true" />
          <AlertTitle>Retry issue</AlertTitle>
          <AlertDescription className="text-[#8a2d2d]">
            {result.error.message}
          </AlertDescription>
        </Alert>
      ) : null}
    </div>
  );
}
