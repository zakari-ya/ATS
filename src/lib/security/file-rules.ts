import {
  ACCEPTED_CV_FILE_EXTENSION,
  ACCEPTED_CV_MIME_TYPES,
  MAX_CV_FILE_SIZE_BYTES,
} from "@/features/scan/constants";
import type { ServerValidationResult } from "@/features/scan/types";

export type SafeCvFileMetadata = {
  originalFileName: string;
  fileSize: number;
  contentType: "application/pdf";
};

function sanitizeFileName(fileName: string): string {
  const normalizedName = fileName.trim().replace(/[^\w.\- ]+/g, "");

  return normalizedName.length > 0 ? normalizedName.slice(0, 180) : "cv.pdf";
}

function assertSafeStorageId(value: string, fieldName: string): string {
  const normalizedValue = value.trim();

  if (!normalizedValue) {
    throw new Error(`Missing ${fieldName}`);
  }

  if (
    normalizedValue.includes("/") ||
    normalizedValue.includes("\\") ||
    normalizedValue.includes("..")
  ) {
    throw new Error(`Invalid ${fieldName}`);
  }

  return normalizedValue;
}

export function buildCvStoragePath(userId: string, scanId: string): string {
  const safeUserId = assertSafeStorageId(userId, "userId");
  const safeScanId = assertSafeStorageId(scanId, "scanId");

  return `${safeUserId}/${safeScanId}/cv.pdf`;
}

export function validateCvUploadMetadata(
  file: File | null
): ServerValidationResult<SafeCvFileMetadata> {
  if (!file || file.size === 0) {
    return {
      valid: false,
      errorCode: "INVALID_FILE_TYPE",
      message: "Upload a PDF CV before starting the analysis.",
    };
  }

  if (file.size > MAX_CV_FILE_SIZE_BYTES) {
    return {
      valid: false,
      errorCode: "FILE_TOO_LARGE",
      message: "Upload a PDF under 5 MB.",
    };
  }

  const safeFileName = sanitizeFileName(file.name);
  const hasPdfExtension = safeFileName
    .toLowerCase()
    .endsWith(ACCEPTED_CV_FILE_EXTENSION);
  const hasExpectedContentType =
    file.type === ACCEPTED_CV_MIME_TYPES[0];

  if (!hasPdfExtension || !hasExpectedContentType) {
    return {
      valid: false,
      errorCode: "INVALID_FILE_TYPE",
      message: "Upload a PDF file.",
    };
  }

  return {
    valid: true,
    value: {
      originalFileName: safeFileName,
      fileSize: file.size,
      contentType: "application/pdf",
    },
  };
}
