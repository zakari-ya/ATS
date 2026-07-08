import { describe, expect, it } from "vitest";

import {
  MAX_EXTRACTED_CV_TEXT_LENGTH,
  MIN_EXTRACTED_CV_TEXT_LENGTH,
  validateExtractedPdfText,
  validatePdfBuffer,
} from "@/lib/pdf/pdf-validation";

function createPdfBuffer(body = "Hello PDF") {
  return Buffer.from(`%PDF-1.4\n${body}`);
}

describe("PDF validation helpers", () => {
  it("accepts valid PDF magic bytes", () => {
    const result = validatePdfBuffer({
      buffer: createPdfBuffer(),
      contentType: "application/pdf",
      storagePath: "user/scan/cv.pdf",
    });

    expect(result.valid).toBe(true);
  });

  it("fails when PDF magic bytes are missing", () => {
    const result = validatePdfBuffer({
      buffer: Buffer.from("not a pdf"),
      contentType: "application/pdf",
      storagePath: "user/scan/cv.pdf",
    });

    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.errorCode).toBe("PDF_MAGIC_BYTES_INVALID");
    }
  });

  it("fails for empty buffer", () => {
    const result = validatePdfBuffer({
      buffer: Buffer.alloc(0),
      contentType: "application/pdf",
      storagePath: "user/scan/cv.pdf",
    });

    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.errorCode).toBe("CV_FILE_NOT_FOUND");
    }
  });

  it("fails for files over 5MB", () => {
    const result = validatePdfBuffer({
      buffer: Buffer.alloc(5 * 1024 * 1024 + 1, 0),
      contentType: "application/pdf",
      storagePath: "user/scan/cv.pdf",
    });

    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.errorCode).toBe("FILE_TOO_LARGE");
    }
  });

  it("fails for wrong MIME type", () => {
    const result = validatePdfBuffer({
      buffer: createPdfBuffer(),
      contentType: "text/plain",
      storagePath: "user/scan/cv.pdf",
    });

    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.errorCode).toBe("INVALID_FILE_TYPE");
    }
  });

  it("fails when extracted text is too short and uses the scanned PDF message", () => {
    const result = validateExtractedPdfText(
      "x".repeat(MIN_EXTRACTED_CV_TEXT_LENGTH - 1)
    );

    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.errorCode).toBe("CV_TEXT_TOO_SHORT");
      expect(result.message).toBe(
        "This PDF looks like a scanned image. Please upload a text-based CV PDF where the text is selectable."
      );
    }
  });

  it("fails when extracted text is too long", () => {
    const result = validateExtractedPdfText(
      "x".repeat(MAX_EXTRACTED_CV_TEXT_LENGTH + 1)
    );

    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.errorCode).toBe("CV_TEXT_TOO_LONG");
    }
  });

  it("accepts extracted text within limits", () => {
    const result = validateExtractedPdfText(
      "x".repeat(MIN_EXTRACTED_CV_TEXT_LENGTH)
    );

    expect(result.valid).toBe(true);
  });
});
