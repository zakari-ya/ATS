import { describe, expect, it } from "vitest";

import {
  getUsageLimitsConfig,
  getDailyUsagePeriodKey,
  USAGE_LIMITS,
} from "@/lib/security/usage-limits";
import {
  getRemainingUsage,
  getUsageProgressPercent,
  isUsageLimitReached,
} from "@/features/usage/helpers";

describe("usage limit helpers", () => {
  it("returns a YYYY-MM-DD period key", () => {
    expect(getDailyUsagePeriodKey(new Date("2026-07-06T12:34:56.000Z"))).toBe(
      "2026-07-06"
    );
  });

  it("uses safe defaults when env values are missing", () => {
    const config = getUsageLimitsConfig({});

    expect(config.maxScansPerDay).toBe(5);
    expect(config.maxFileUploadsPerDay).toBe(10);
    expect(config.maxAiRequestsPerDay).toBe(5);
  });

  it("falls back safely when env values are invalid", () => {
    const config = getUsageLimitsConfig({
      MAX_SCANS_PER_DAY: "abc",
      MAX_FILE_UPLOADS_PER_DAY: "-1",
      MAX_AI_REQUESTS_PER_DAY: "0",
    });

    expect(config.maxScansPerDay).toBe(USAGE_LIMITS.maxScansPerDay);
    expect(config.maxFileUploadsPerDay).toBe(USAGE_LIMITS.maxFileUploadsPerDay);
    expect(config.maxAiRequestsPerDay).toBe(USAGE_LIMITS.maxAiRequestsPerDay);
  });

  it("allows usage under limit and blocks usage at limit", () => {
    expect(isUsageLimitReached(4, 5)).toBe(false);
    expect(isUsageLimitReached(5, 5)).toBe(true);
    expect(isUsageLimitReached(10, 10)).toBe(true);
  });

  it("remaining counts never go below zero", () => {
    expect(getRemainingUsage(2, 5)).toBe(3);
    expect(getRemainingUsage(7, 5)).toBe(0);
    expect(getRemainingUsage(-1, 5)).toBe(5);
  });

  it("progress percentage is clamped between 0 and 100", () => {
    expect(getUsageProgressPercent(2, 5)).toBe(40);
    expect(getUsageProgressPercent(9, 5)).toBe(100);
    expect(getUsageProgressPercent(-4, 5)).toBe(0);
    expect(getUsageProgressPercent(2, 0)).toBe(0);
  });
});
