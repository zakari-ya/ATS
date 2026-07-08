import { describe, expect, it } from "vitest";

import { buildCvStoragePath } from "@/lib/storage/cv-storage";

describe("buildCvStoragePath", () => {
  it("builds the expected private CV path", () => {
    expect(buildCvStoragePath("user-123", "scan-456")).toBe(
      "user-123/scan-456/cv.pdf"
    );
  });

  it("ignores any original filename input because the helper does not accept one", () => {
    const path = buildCvStoragePath("user-123", "scan-456");
    expect(path).not.toContain("resume.pdf");
    expect(path.endsWith("/cv.pdf")).toBe(true);
  });

  it("throws when user id is missing", () => {
    expect(() => buildCvStoragePath("", "scan-456")).toThrow("Missing userId");
  });

  it("throws when scan id is missing", () => {
    expect(() => buildCvStoragePath("user-123", "")).toThrow("Missing scanId");
  });

  it("rejects path traversal attempts", () => {
    expect(() => buildCvStoragePath("../user", "scan-456")).toThrow(
      "Invalid userId"
    );
    expect(() => buildCvStoragePath("user-123", "../scan")).toThrow(
      "Invalid scanId"
    );
  });
});
