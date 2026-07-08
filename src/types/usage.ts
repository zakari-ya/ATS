export type UsageCounterName =
  | "scans_used"
  | "files_uploaded"
  | "ai_requests_used";

export type DailyUsage = {
  userId: string;
  periodKey: string;
  scansUsed: number;
  filesUploaded: number;
  aiRequestsUsed: number;
};

export type UsageLimitErrorCode =
  | "DAILY_SCAN_LIMIT_REACHED"
  | "DAILY_UPLOAD_LIMIT_REACHED"
  | "DAILY_AI_LIMIT_REACHED"
  | "USAGE_COUNTER_FAILED";

export type TodayUsageSummary = {
  periodKey: string;
  scansUsed: number;
  scansLimit: number;
  uploadsUsed: number;
  uploadsLimit: number;
  aiRequestsUsed: number;
  aiRequestsLimit: number;
  remainingScans: number;
  remainingUploads: number;
  remainingAiRequests: number;
  isScanLimitReached: boolean;
  isUploadLimitReached: boolean;
  isAiLimitReached: boolean;
};

export type UsageLimitCheckResult =
  | {
      ok: true;
    }
  | {
      ok: false;
      errorCode: UsageLimitErrorCode;
      message: string;
      limit: number;
      used: number;
    };

export type UsageIncrementResult =
  | {
      ok: true;
      usage: DailyUsage;
    }
  | {
      ok: false;
      errorCode: "USAGE_COUNTER_FAILED";
      message: string;
    };
