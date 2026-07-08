"use client";

import { AlertTriangle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function ScanResultError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex h-full min-h-0 items-center">
      <Card className="w-full border-[#e6d0b8] bg-white shadow-sm shadow-[#183f3a]/5">
        <CardContent className="flex flex-col gap-6 p-6 sm:p-8">
          <div className="space-y-4">
            <div className="flex size-12 items-center justify-center rounded-2xl bg-[#fffaf4] text-[#8b5e27]">
              <AlertTriangle className="size-5" aria-hidden="true" />
            </div>
            <div className="space-y-3">
              <h1 className="text-3xl font-semibold tracking-tight text-[#183f3a]">
                Something went wrong while loading this page.
              </h1>
              <p className="text-base leading-7 text-[#66736f]">
                Please try again. Private scan data was not exposed.
              </p>
            </div>
          </div>

          <Button
            type="button"
            onClick={reset}
            className="h-11 w-fit rounded-xl bg-[#183f3a] px-4 text-white hover:bg-[#1f4d47]"
          >
            Try again
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
