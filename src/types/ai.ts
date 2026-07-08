import type { z } from "zod";

import type {
  aiCvMatchResponseSchema,
  aiInputQualitySchema,
  aiMatchMatrixItemSchema,
  aiMatchStatusSchema,
  aiRequirementPrioritySchema,
} from "@/lib/ai/cv-match-schema";

export type AiCvMatchResponse = z.infer<typeof aiCvMatchResponseSchema>;
export type AiInputQuality = z.infer<typeof aiInputQualitySchema>;
export type AiMatchMatrixItem = z.infer<typeof aiMatchMatrixItemSchema>;
export type AiRequirementPriority = z.infer<typeof aiRequirementPrioritySchema>;
export type AiMatchStatus = z.infer<typeof aiMatchStatusSchema>;

export type SafeAiValidationIssue = {
  path: string;
  message: string;
};

export type SafeAiParseResult =
  | {
      ok: true;
      data: AiCvMatchResponse;
    }
  | {
      ok: false;
      errorCode: "AI_JSON_INVALID";
      issues: SafeAiValidationIssue[];
    };
