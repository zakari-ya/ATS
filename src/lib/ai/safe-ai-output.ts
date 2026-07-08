import { ZodError } from "zod";

import {
  AI_MATCH_STRENGTH_BY_STATUS,
  aiCvMatchResponseSchema,
} from "@/lib/ai/cv-match-schema";
import type {
  AiCvMatchResponse,
  SafeAiParseResult,
  SafeAiValidationIssue,
} from "@/types/ai";

type UnknownJsonParseResult =
  | {
      ok: true;
      data: unknown;
    }
  | {
      ok: false;
      errorCode: "AI_JSON_INVALID";
      issues: SafeAiValidationIssue[];
    };

export class SafeAiOutputValidationError extends Error {
  readonly errorCode = "AI_JSON_INVALID";
  readonly issues: SafeAiValidationIssue[];

  constructor(issues: SafeAiValidationIssue[]) {
    super("AI JSON validation failed.");
    this.name = "SafeAiOutputValidationError";
    this.issues = issues;
  }
}

function formatIssuePath(path: PropertyKey[]): string {
  if (path.length === 0) {
    return "root";
  }

  return path.map(String).join(".");
}

function toSafeIssues(error: ZodError): SafeAiValidationIssue[] {
  return error.issues.slice(0, 20).map((issue) => ({
    path: formatIssuePath(issue.path),
    message: issue.message,
  }));
}

function parseUnknownJson(input: unknown): UnknownJsonParseResult {
  if (typeof input !== "string") {
    return {
      ok: true,
      data: input,
    };
  }

  try {
    return {
      ok: true,
      data: JSON.parse(input) as unknown,
    };
  } catch {
    return {
      ok: false,
      errorCode: "AI_JSON_INVALID",
      issues: [
        {
          path: "root",
          message: "AI output must be valid JSON.",
        },
      ],
    };
  }
}

export function safeParseAiCvMatchResponse(input: unknown): SafeAiParseResult {
  const parsedInput = parseUnknownJson(input);

  if (!parsedInput.ok) {
    return parsedInput;
  }

  const validationInput = normalizeCommonAiJsonDrift(parsedInput.data);
  const validation = aiCvMatchResponseSchema.safeParse(validationInput);

  if (!validation.success) {
    return {
      ok: false,
      errorCode: "AI_JSON_INVALID",
      issues: toSafeIssues(validation.error),
    };
  }

  return {
    ok: true,
    data: validation.data,
  };
}

function normalizeCommonAiJsonDrift(input: unknown): unknown {
  if (!isRecord(input)) {
    return input;
  }

  return {
    ...input,
    job_profile: normalizeJobProfile(input.job_profile),
    match_matrix: normalizeMatchMatrix(input.match_matrix),
  };
}

function normalizeJobProfile(value: unknown): unknown {
  if (!isRecord(value) || !isRecord(value.experience_requirements)) {
    return value;
  }

  const minimumYears = value.experience_requirements.minimum_years;

  return {
    ...value,
    experience_requirements: {
      ...value.experience_requirements,
      minimum_years:
        typeof minimumYears === "string"
          ? parseMinimumYears(minimumYears)
          : minimumYears,
    },
  };
}

function normalizeMatchMatrix(value: unknown): unknown {
  if (!Array.isArray(value)) {
    return value;
  }

  return value.map((item) => {
    if (!isRecord(item)) {
      return item;
    }

    const matchStatus = item.match_status;

    if (!isAiMatchStatus(matchStatus)) {
      return item;
    }

    return {
      ...item,
      match_strength: AI_MATCH_STRENGTH_BY_STATUS[matchStatus],
      cv_evidence:
        matchStatus === "missing" ? null : normalizeEvidence(item.cv_evidence),
    };
  });
}

function parseMinimumYears(value: string): number | null {
  const firstNumber = value.match(/\d+/)?.[0];

  if (!firstNumber) {
    return null;
  }

  const parsed = Number(firstNumber);
  return Number.isInteger(parsed) && parsed >= 0 && parsed <= 60
    ? parsed
    : null;
}

function normalizeEvidence(value: unknown): unknown {
  if (typeof value !== "string") {
    return value;
  }

  const trimmed = value.trim();
  const emptyEvidenceValues = new Set([
    "n/a",
    "na",
    "none",
    "not found",
    "not visible",
    "no evidence",
    "no cv evidence",
  ]);

  return emptyEvidenceValues.has(trimmed.toLowerCase()) ? "" : value;
}

function isAiMatchStatus(
  value: unknown
): value is keyof typeof AI_MATCH_STRENGTH_BY_STATUS {
  return (
    value === "exact_match" ||
    value === "semantic_match" ||
    value === "partial_match" ||
    value === "unclear" ||
    value === "missing"
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function parseAiCvMatchResponse(input: unknown): AiCvMatchResponse {
  const result = safeParseAiCvMatchResponse(input);

  if (!result.ok) {
    throw new SafeAiOutputValidationError(result.issues);
  }

  return result.data;
}

export function validateAiCvMatchResponse(input: unknown): SafeAiParseResult {
  return safeParseAiCvMatchResponse(input);
}
