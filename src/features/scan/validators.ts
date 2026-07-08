import {
  ACCEPTED_CV_FILE_EXTENSION,
  ACCEPTED_CV_MIME_TYPES,
  JOB_DESCRIPTION_MAX_LENGTH,
  JOB_DESCRIPTION_MIN_LENGTH,
  MAX_CV_FILE_SIZE_BYTES,
  MAX_CV_FILE_SIZE_LABEL,
} from "@/features/scan/constants";
import type { UiValidationResult } from "@/features/scan/types";

// UI-only validation. Server-side validation remains the security boundary.
export function validateCvFileForUi(file: File | null): UiValidationResult {
  if (!file) {
    return {
      valid: false,
      error: "Choose a PDF CV to continue.",
    };
  }

  const fileName = file.name.toLowerCase();
  const hasPdfExtension = fileName.endsWith(ACCEPTED_CV_FILE_EXTENSION);
  const hasAcceptedMimeType =
    file.type === "" ||
    ACCEPTED_CV_MIME_TYPES.includes(
      file.type as (typeof ACCEPTED_CV_MIME_TYPES)[number]
    );

  if (!hasPdfExtension || !hasAcceptedMimeType) {
    return {
      valid: false,
      error: "Please upload a PDF file.",
    };
  }

  if (file.size > MAX_CV_FILE_SIZE_BYTES) {
    return {
      valid: false,
      error: `This file is too large. Maximum size is ${MAX_CV_FILE_SIZE_LABEL}.`,
    };
  }

  return { valid: true };
}

// UI-only validation. The server will sanitize and validate this text later.
export function validateJobDescriptionForUi(text: string): UiValidationResult {
  const trimmedText = text.trim();

  if (trimmedText.length === 0) {
    return {
      valid: false,
      error: "Paste the job post before starting an analysis.",
    };
  }

  if (trimmedText.length < JOB_DESCRIPTION_MIN_LENGTH) {
    return {
      valid: false,
      error: `Add a little more detail. Aim for at least ${JOB_DESCRIPTION_MIN_LENGTH} characters.`,
    };
  }

  if (text.length > JOB_DESCRIPTION_MAX_LENGTH) {
    return {
      valid: false,
      error: `Keep the job post under ${JOB_DESCRIPTION_MAX_LENGTH.toLocaleString()} characters.`,
    };
  }

  return { valid: true };
}
