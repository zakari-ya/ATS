import type { UsageLimitErrorCode } from "@/types/usage";

export const USAGE_LIMIT_MESSAGES = {
  DAILY_SCAN_LIMIT_REACHED:
    "You reached your daily scan limit. Please try again tomorrow.",
  DAILY_UPLOAD_LIMIT_REACHED:
    "You reached your daily upload limit. Please try again tomorrow.",
  DAILY_AI_LIMIT_REACHED:
    "You reached your daily analysis limit. Please try again tomorrow.",
  USAGE_COUNTER_FAILED:
    "We could not verify your daily usage. Please try again.",
} as const satisfies Record<UsageLimitErrorCode, string>;

export function getUsageLimitMessage(errorCode: UsageLimitErrorCode): string {
  return USAGE_LIMIT_MESSAGES[errorCode];
}
