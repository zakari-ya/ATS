"use client";

import { AlertTriangle } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { cn } from "@/lib/utils";
import type { TodayUsageSummary } from "@/types/usage";

type UsageLimitAlertProps = {
  usage: TodayUsageSummary;
  className?: string;
};

export function UsageLimitAlert({
  usage,
  className,
}: UsageLimitAlertProps) {
  const messages = [
    usage.isAiLimitReached
      ? "You reached your daily analysis limit. Please try again tomorrow."
      : null,
    usage.isScanLimitReached
      ? "You reached your daily scan limit. Please try again tomorrow."
      : null,
    usage.isUploadLimitReached
      ? "You reached your daily upload limit. Please try again tomorrow."
      : null,
  ].filter((message): message is string => Boolean(message));

  if (messages.length === 0) {
    return null;
  }

  return (
    <Alert
      className={cn(
        "border-[#f0d7c5] bg-[#fffaf4] text-[#8b5e27] shadow-sm",
        className
      )}
    >
      <AlertTriangle className="size-4" aria-hidden="true" />
      <AlertTitle>Daily limit reached</AlertTitle>
      <AlertDescription className="space-y-2 text-[#8b5e27]">
        {messages.map((message) => (
          <p key={message}>{message}</p>
        ))}
      </AlertDescription>
    </Alert>
  );
}
