"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, Loader2, Trash2 } from "lucide-react";

import { deleteScanAction } from "@/features/scan/actions";
import type { DeleteScanActionResult } from "@/features/scan/types";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

type DeleteScanButtonProps = {
  scanId: string;
  redirectTo?: string;
  label?: string;
  variant?: "outline" | "ghost" | "destructive";
  size?: "default" | "sm" | "lg";
  className?: string;
};

export function DeleteScanButton({
  scanId,
  redirectTo,
  label = "Delete scan",
  variant = "outline",
  size = "sm",
  className,
}: DeleteScanButtonProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [result, setResult] = useState<DeleteScanActionResult | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleDelete() {
    setResult(null);

    startTransition(() => {
      void (async () => {
        const deleteResult = await deleteScanAction(scanId);
        setResult(deleteResult);

        if (!deleteResult.ok) {
          return;
        }

        setOpen(false);

        if (redirectTo) {
          router.push(redirectTo);
          return;
        }

        router.refresh();
      })();
    });
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen);

        if (nextOpen) {
          setResult(null);
        }
      }}
    >
      <DialogTrigger asChild>
        <Button
          type="button"
          variant={variant}
          size={size}
          className={className}
        >
          <Trash2 className="size-4" aria-hidden="true" />
          {label}
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-md rounded-2xl border border-[rgba(31,77,71,0.12)] bg-white p-0 text-[#183f3a] shadow-lg shadow-[#183f3a]/10">
        <DialogHeader className="p-5 pb-2 sm:p-6 sm:pb-2">
          <div className="flex size-12 items-center justify-center rounded-2xl bg-[#fff7f7] text-[#8a2d2d]">
            <AlertTriangle className="size-5" aria-hidden="true" />
          </div>
          <DialogTitle className="pt-4 text-xl font-semibold tracking-tight">
            Delete this scan?
          </DialogTitle>
          <DialogDescription className="leading-7 text-[#66736f]">
            Delete this scan? This will remove the analysis and the uploaded CV
            file. This action cannot be undone.
          </DialogDescription>
        </DialogHeader>

        <div className="px-5 pb-5 sm:px-6 sm:pb-6">
          {result && !result.ok ? (
            <Alert className="border-[#f0c8c8] bg-[#fff7f7] text-[#8a2d2d]">
              <AlertTriangle className="size-4" aria-hidden="true" />
              <AlertTitle>Delete issue</AlertTitle>
              <AlertDescription className="text-[#8a2d2d]">
                {result.error.message}
              </AlertDescription>
            </Alert>
          ) : null}
        </div>

        <DialogFooter className="rounded-b-2xl border-[rgba(31,77,71,0.12)] bg-[#f8f7f3]">
          <DialogClose asChild>
            <Button
              type="button"
              variant="outline"
              className="rounded-xl border-[rgba(31,77,71,0.14)] bg-white text-[#183f3a] hover:bg-[#eef4f2]"
              disabled={isPending}
            >
              Cancel
            </Button>
          </DialogClose>
          <Button
            type="button"
            variant="destructive"
            className="rounded-xl"
            disabled={isPending}
            onClick={handleDelete}
          >
            {isPending ? (
              <>
                <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                Deleting
              </>
            ) : (
              <>
                <Trash2 className="size-4" aria-hidden="true" />
                Delete scan
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
