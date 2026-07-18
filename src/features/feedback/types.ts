import type { ScanLabel, ScanStatus } from "@/types/scan";
import type { AppliedScoreCapCode } from "@/types/scoring";

export type FeedbackSkillItem = {
  requirement: string;
  category: string | null;
  priority: "critical" | "required" | "preferred" | null;
  matchStatus:
    | "exact_match"
    | "semantic_match"
    | "partial_match"
    | "unclear"
    | "missing"
    | null;
  confidence: number | null;
  jobEvidence: string | null;
  cvEvidence: string | null;
  reason: string | null;
};

export type FeedbackAppliedCap = {
  code: AppliedScoreCapCode | string | null;
  maxScore: number | null;
  reason: string;
};

export type FeedbackScoreBreakdown = {
  requiredRequirementsScore: number | null;
  preferredSkillsScore: number | null;
  experienceRelevanceScore: number | null;
  projectEvidenceScore: number | null;
  cvClarityScore: number | null;
  baseWeightedScore: number | null;
  finalScore: number | null;
};

export type FeedbackScanSummary = {
  id: string;
  jobTitle: string | null;
  currentStatus: ScanStatus;
  hasStoredCv: boolean;
  finalScore: number | null;
  finalLabel: ScanLabel | null;
  createdAt: string;
  completedAt: string | null;
};

export type FeedbackResultDetails = {
  aiValidationStatus: "pending" | "valid" | "invalid";
  cvTextCharCount: number | null;
  finalScore: number | null;
  finalLabel: ScanLabel | null;
  scoreBreakdown: FeedbackScoreBreakdown;
  matchedSkills: FeedbackSkillItem[];
  missingRequiredSkills: FeedbackSkillItem[];
  missingPreferredSkills: FeedbackSkillItem[];
  strongPoints: string[];
  weakPoints: string[];
  recommendations: string[];
  appliedCaps: FeedbackAppliedCap[];
  errorCode: string | null;
  errorMessage: string | null;
  updatedAt: string;
};

export type ResultPageState =
  | {
      kind: "ready";
      scan: FeedbackScanSummary;
      result: FeedbackResultDetails;
    }
  | {
      kind: "not_ready" | "failed" | "missing_result";
      scan: FeedbackScanSummary;
      result: FeedbackResultDetails | null;
      title: string;
      message: string;
      statusLabel: string;
      retryAvailable?: boolean;
    };

export function parseNumberValue(value: unknown): number | null {
  const numberValue =
    typeof value === "number"
      ? value
      : typeof value === "string"
        ? Number(value)
        : null;

  return typeof numberValue === "number" && Number.isFinite(numberValue)
    ? numberValue
    : null;
}

export function parseTextArray(value: unknown, maxItems = 12): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => (typeof item === "string" ? item.trim() : ""))
    .filter(Boolean)
    .slice(0, maxItems);
}

export function parseSkillItems(value: unknown): FeedbackSkillItem[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map(parseSkillItem)
    .filter((item): item is FeedbackSkillItem => Boolean(item))
    .slice(0, 40);
}

export function parseAppliedCaps(value: unknown): FeedbackAppliedCap[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => {
      if (!isRecord(item)) {
        return null;
      }

      const reason = parseString(item.reason);

      if (!reason) {
        return null;
      }

      return {
        code: parseString(item.code),
        maxScore: parseNumberValue(item.maxScore),
        reason,
      };
    })
    .filter((item): item is FeedbackAppliedCap => Boolean(item))
    .slice(0, 8);
}

export function parseScoreBreakdown(value: unknown): FeedbackScoreBreakdown {
  const record = isRecord(value) ? value : {};

  return {
    requiredRequirementsScore: parseNumberValue(
      record.requiredRequirementsScore
    ),
    preferredSkillsScore: parseNumberValue(record.preferredSkillsScore),
    experienceRelevanceScore: parseNumberValue(
      record.experienceRelevanceScore
    ),
    projectEvidenceScore: parseNumberValue(record.projectEvidenceScore),
    cvClarityScore: parseNumberValue(record.cvClarityScore),
    baseWeightedScore: parseNumberValue(record.baseWeightedScore),
    finalScore: parseNumberValue(record.finalScore),
  };
}

function parseSkillItem(value: unknown): FeedbackSkillItem | null {
  if (!isRecord(value)) {
    return null;
  }

  const requirement =
    parseString(value.requirement) ??
    parseString(value.name) ??
    parseString(value.skill);

  if (!requirement) {
    return null;
  }

  return {
    requirement,
    category: parseString(value.category),
    priority: parsePriority(value.priority),
    matchStatus: parseMatchStatus(value.match_status ?? value.matchStatus),
    confidence: parseNumberValue(value.confidence),
    jobEvidence: parseString(value.job_evidence ?? value.jobEvidence),
    cvEvidence: parseString(value.cv_evidence ?? value.cvEvidence),
    reason: parseString(value.reason ?? value.evidence),
  };
}

function parseString(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function parsePriority(
  value: unknown
): FeedbackSkillItem["priority"] {
  return value === "critical" || value === "required" || value === "preferred"
    ? value
    : null;
}

function parseMatchStatus(
  value: unknown
): FeedbackSkillItem["matchStatus"] {
  return value === "exact_match" ||
    value === "semantic_match" ||
    value === "partial_match" ||
    value === "unclear" ||
    value === "missing"
    ? value
    : null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
