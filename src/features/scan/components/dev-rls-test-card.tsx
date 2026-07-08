"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { AlertCircle, CheckCircle2, Database, Loader2 } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { createRlsTestScan } from "@/features/scan/actions";
import type { CreateRlsTestScanResult } from "@/types/scan";

export function DevRlsTestCard() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<CreateRlsTestScanResult | null>(null);

  if (process.env.NODE_ENV !== "development") {
    return null;
  }

  function handleCreateTestScan() {
    setResult(null);

    startTransition(() => {
      void createRlsTestScan().then((actionResult) => {
        setResult(actionResult);

        if (actionResult.ok) {
          router.refresh();
        }
      });
    });
  }

  return (
    <Card className="border-[#2a625b] bg-[#183f3a] p-2 text-white shadow-sm shadow-[#183f3a]/15">
      <CardHeader className="px-4 pt-4">
        <div className="mb-4 flex size-11 items-center justify-center rounded-2xl bg-white text-[#183f3a]">
          <Database className="size-5" aria-hidden="true" />
        </div>
        <CardTitle className="text-xl font-semibold tracking-tight">
          Development RLS check
        </CardTitle>
        <CardDescription className="text-white/68">
          Create one lightweight test scan using your authenticated session.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 px-4 pb-4">
        <Button
          type="button"
          onClick={handleCreateTestScan}
          disabled={isPending}
          className="h-11 w-full rounded-xl bg-white text-[#183f3a] hover:bg-[#eef4f2]"
        >
          {isPending ? (
            <>
              <Loader2 className="size-4 animate-spin" aria-hidden="true" />
              Creating test scan
            </>
          ) : (
            "Create RLS test scan"
          )}
        </Button>

        {result?.ok ? (
          <Alert className="border-[#b9dec9] bg-[#effaf4] text-[#17623a]">
            <CheckCircle2 className="size-4" aria-hidden="true" />
            <AlertTitle>Test scan created</AlertTitle>
            <AlertDescription className="text-[#276948]">
              {result.message}
            </AlertDescription>
          </Alert>
        ) : null}

        {result && !result.ok ? (
          <Alert variant="destructive">
            <AlertCircle className="size-4" aria-hidden="true" />
            <AlertTitle>{result.errorCode}</AlertTitle>
            <AlertDescription>{result.message}</AlertDescription>
          </Alert>
        ) : null}
      </CardContent>
    </Card>
  );
}
