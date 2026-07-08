import {
  JOB_DESCRIPTION_MAX_LENGTH,
  JOB_DESCRIPTION_MIN_LENGTH,
} from "@/features/scan/constants";
import type { ScanErrorCode, ServerValidationResult } from "@/features/scan/types";

export function sanitizeJobDescription(text: string): string {
  return text
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?>[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function validateJobDescriptionServer(
  text: string
): ServerValidationResult<string> {
  const sanitizedText = sanitizeJobDescription(text);

  if (sanitizedText.length < JOB_DESCRIPTION_MIN_LENGTH) {
    return {
      valid: false,
      errorCode: "JOB_DESCRIPTION_TOO_SHORT",
      message: "Paste a longer job post before starting the analysis.",
    };
  }

  if (sanitizedText.length > JOB_DESCRIPTION_MAX_LENGTH) {
    return {
      valid: false,
      errorCode: "JOB_DESCRIPTION_TOO_LONG",
      message: "Keep the job post under 20,000 characters.",
    };
  }

  return {
    valid: true,
    value: sanitizedText,
  };
}

export function isScanErrorCode(value: string): value is ScanErrorCode {
  return [
    "UNAUTHORIZED",
    "SCAN_NOT_FOUND",
    "CV_FILE_NOT_FOUND",
    "JOB_DESCRIPTION_TOO_SHORT",
    "JOB_DESCRIPTION_TOO_LONG",
    "INVALID_FILE_TYPE",
    "FILE_TOO_LARGE",
    "PDF_MAGIC_BYTES_INVALID",
    "PDF_TEXT_EXTRACTION_FAILED",
    "CV_TEXT_TOO_SHORT",
    "CV_TEXT_TOO_LONG",
    "STORAGE_DOWNLOAD_FAILED",
    "STORAGE_UPLOAD_FAILED",
    "DATABASE_WRITE_FAILED",
  ].includes(value);
}
