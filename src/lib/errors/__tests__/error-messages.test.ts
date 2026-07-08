import { describe, expect, it } from "vitest";

import {
  SAFE_ERROR_MESSAGES,
  getSafeErrorMessage,
} from "@/lib/errors/error-messages";

describe("safe error messages", () => {
  it("has a safe user-facing message for every error code", () => {
    for (const [code, message] of Object.entries(SAFE_ERROR_MESSAGES)) {
      expect(code.length).toBeGreaterThan(0);
      expect(message.length).toBeGreaterThan(0);
      expect(getSafeErrorMessage(code as keyof typeof SAFE_ERROR_MESSAGES)).toBe(
        message
      );
    }
  });

  it("keeps UNKNOWN_ERROR generic", () => {
    expect(getSafeErrorMessage("UNKNOWN_ERROR")).toBe(
      "Something went wrong. Please try again."
    );
  });

  it("does not leak SQL, stack traces, or storage paths", () => {
    const joinedMessages = Object.values(SAFE_ERROR_MESSAGES).join(" ").toLowerCase();

    expect(joinedMessages).not.toContain("select ");
    expect(joinedMessages).not.toContain("insert ");
    expect(joinedMessages).not.toContain("update ");
    expect(joinedMessages).not.toContain("delete from");
    expect(joinedMessages).not.toContain("stack");
    expect(joinedMessages).not.toContain("trace");
    expect(joinedMessages).not.toContain("cv-uploads/");
    expect(joinedMessages).not.toContain("../");
  });

  it("matches the daily AI limit UI copy", () => {
    expect(getSafeErrorMessage("DAILY_AI_LIMIT_REACHED")).toBe(
      "You reached your daily analysis limit. Please try again tomorrow."
    );
  });

  it("matches the scanned PDF message", () => {
    expect(getSafeErrorMessage("CV_TEXT_TOO_SHORT")).toBe(
      "This PDF looks like a scanned image. Please upload a text-based CV PDF where the text is selectable."
    );
  });
});
