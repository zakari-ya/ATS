import {
  MAX_CV_FILE_SIZE_BYTES,
  MAX_CV_FILE_SIZE_LABEL,
} from "@/features/scan/constants";
import type { ServerValidationResult } from "@/features/scan/types";

export const MIN_EXTRACTED_CV_TEXT_LENGTH = 100;
export const MAX_EXTRACTED_CV_TEXT_LENGTH = 100000;
const SCANNED_IMAGE_PDF_MESSAGE =
  "This PDF looks like a scanned image. Please upload a text-based CV PDF where the text is selectable.";

function getByteLength(buffer: ArrayBuffer | Buffer): number {
  return buffer.byteLength;
}

function startsWithPdfMagicBytes(buffer: ArrayBuffer | Buffer): boolean {
  const bytes = new Uint8Array(buffer instanceof Buffer ? buffer : buffer);
  const header = new TextDecoder("ascii").decode(bytes.slice(0, 4));

  return header === "%PDF";
}

export function validatePdfBuffer({
  buffer,
  contentType,
  storagePath,
}: {
  buffer: ArrayBuffer | Buffer | null;
  contentType: string | null;
  storagePath: string | null;
}): ServerValidationResult<ArrayBuffer | Buffer> {
  if (!buffer || getByteLength(buffer) === 0) {
    return {
      valid: false,
      errorCode: "CV_FILE_NOT_FOUND",
      message: "We could not find the uploaded CV file.",
    };
  }

  if (getByteLength(buffer) > MAX_CV_FILE_SIZE_BYTES) {
    return {
      valid: false,
      errorCode: "FILE_TOO_LARGE",
      message: `Upload a PDF under ${MAX_CV_FILE_SIZE_LABEL}.`,
    };
  }

  if (contentType && contentType !== "application/pdf") {
    return {
      valid: false,
      errorCode: "INVALID_FILE_TYPE",
      message: "Upload a PDF file.",
    };
  }

  if (storagePath && !storagePath.toLowerCase().endsWith(".pdf")) {
    return {
      valid: false,
      errorCode: "INVALID_FILE_TYPE",
      message: "Upload a PDF file.",
    };
  }

  if (!startsWithPdfMagicBytes(buffer)) {
    return {
      valid: false,
      errorCode: "PDF_MAGIC_BYTES_INVALID",
      message: "We could not safely read this PDF. Please upload a clean text-based PDF under 5MB.",
    };
  }

  return {
    valid: true,
    value: buffer,
  };
}

export function validateExtractedPdfText(
  text: string
): ServerValidationResult<string> {
  const trimmedText = text.trim();

  if (trimmedText.length === 0) {
    return {
      valid: false,
      errorCode: "CV_TEXT_TOO_SHORT",
      message: SCANNED_IMAGE_PDF_MESSAGE,
    };
  }

  if (trimmedText.length < MIN_EXTRACTED_CV_TEXT_LENGTH) {
    return {
      valid: false,
      errorCode: "CV_TEXT_TOO_SHORT",
      message: SCANNED_IMAGE_PDF_MESSAGE,
    };
  }

  if (trimmedText.length > MAX_EXTRACTED_CV_TEXT_LENGTH) {
    return {
      valid: false,
      errorCode: "CV_TEXT_TOO_LONG",
      message: "This PDF contains too much text to analyze safely. Please upload a shorter CV PDF.",
    };
  }

  return {
    valid: true,
    value: trimmedText,
  };
}
