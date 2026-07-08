import type { AppErrorCode } from "@/lib/errors/app-error";
import type { ActionResult } from "@/lib/errors/safe-action-result";
import type { ScanLabel, ScanStatus } from "@/types/scan";

export type UiValidationResult =
  | {
      valid: true;
      error?: never;
    }
  | {
      valid: false;
      error: string;
    };

export type SelectedCvFileState = {
  file: File;
  fileName: string;
  fileSizeBytes: number;
  fileSizeLabel: string;
  validation: UiValidationResult;
};

export type ScanFormUiState = {
  cvFile: SelectedCvFileState | null;
  jobDescription: string;
};

export type ScanErrorCode = AppErrorCode;

export type ServerValidationResult<T> =
  | {
      valid: true;
      value: T;
    }
  | {
      valid: false;
      errorCode: ScanErrorCode;
      message: string;
    };

export type CreateScanUploadResult = ActionResult<
  {
    scanId: string;
    message: string;
  },
  ScanErrorCode
>;

export type ExtractCvTextResult = ActionResult<
  {
    scanId: string;
    charCount: number;
    pageCount: number | null;
    message: string;
  },
  ScanErrorCode
>;

export type AnalyzeCvMatchActionResult = ActionResult<
  {
    scanId: string;
    finalScore: number;
    finalLabel: string;
    message: string;
  },
  ScanErrorCode
>;

export type DeleteScanActionResult = ActionResult<
  {
    cleanupWarning: boolean;
    message: string;
  },
  | "UNAUTHORIZED"
  | "SCAN_NOT_FOUND"
  | "DELETE_NOT_ALLOWED"
  | "STORAGE_DELETE_FAILED"
  | "DATABASE_DELETE_FAILED"
  | "DELETE_FAILED"
>;

export type RetryScanActionResult = ActionResult<
  {
    scanId: string;
    stage: "analyzed" | "extracted_then_analyzed";
    message: string;
  },
  ScanErrorCode
>;

export type ScanSubmitStage =
  | "idle"
  | "uploading"
  | "extracting"
  | "analyzing";

export type ScanHistoryItem = {
  id: string;
  jobTitle: string | null;
  currentStatus: ScanStatus;
  finalScore: number | null;
  finalLabel: ScanLabel | null;
  createdAt: string;
  completedAt: string | null;
};
