import { z } from "zod";

import type { AiJsonSchema } from "@/lib/ai/client";

export const RESUME_DRAFT_SCHEMA_VERSION = 1 as const;

export const RESUME_DRAFT_SECTION_NAMES = [
  "summary",
  "skills",
  "experience",
  "projects",
  "education",
  "certifications",
  "languages",
] as const;

const uuidSchema = z.string().uuid();
const generatedTextSchema = z.string().trim().min(1).max(420);
const factIdsSchema = z.array(uuidSchema).min(1).max(30);

export const resumeDraftSentenceSchema = z
  .object({
    id: uuidSchema,
    text: generatedTextSchema,
    sourceFactIds: factIdsSchema,
  })
  .strict();

const resumeDraftEntrySchema = z
  .object({
    entryId: uuidSchema,
    bullets: z.array(resumeDraftSentenceSchema).min(1).max(30),
  })
  .strict();

export const resumeDraftSchema = z
  .object({
    schemaVersion: z.literal(RESUME_DRAFT_SCHEMA_VERSION),
    summarySentences: z.array(resumeDraftSentenceSchema).max(6),
    selectedSkillIds: z.array(uuidSchema).max(120),
    experience: z.array(resumeDraftEntrySchema).max(30),
    projects: z.array(resumeDraftEntrySchema).max(30),
    selectedEducationEntryIds: z.array(uuidSchema).max(20),
    selectedCertificationEntryIds: z.array(uuidSchema).max(30),
    selectedLanguageEntryIds: z.array(uuidSchema).max(20),
    sectionOrder: z.array(z.enum(RESUME_DRAFT_SECTION_NAMES)).min(1).max(7),
    hiddenSections: z.array(z.enum(RESUME_DRAFT_SECTION_NAMES)).max(7).default([]),
    userEditedContentIds: z.array(uuidSchema).max(120).default([]),
    warnings: z.array(z.string().trim().min(1).max(240)).max(12),
  })
  .strict();

export type ResumeDraft = z.infer<typeof resumeDraftSchema>;
export type ResumeDraftSectionName = (typeof RESUME_DRAFT_SECTION_NAMES)[number];

/** Provider-side constraint only. Zod remains the authoritative validator. */
export const resumeDraftResponseJsonSchema = {
  type: "object",
  additionalProperties: false,
  required: [
    "schemaVersion",
    "summarySentences",
    "selectedSkillIds",
    "experience",
    "projects",
    "selectedEducationEntryIds",
    "selectedCertificationEntryIds",
    "selectedLanguageEntryIds",
    "sectionOrder",
    "warnings",
  ],
  properties: {
    schemaVersion: { type: "number", enum: [1] },
    summarySentences: { type: "array", maxItems: 6, items: draftSentenceJsonSchema() },
    selectedSkillIds: { type: "array", maxItems: 120, items: { type: "string" } },
    experience: { type: "array", maxItems: 30, items: draftEntryJsonSchema() },
    projects: { type: "array", maxItems: 30, items: draftEntryJsonSchema() },
    selectedEducationEntryIds: { type: "array", maxItems: 20, items: { type: "string" } },
    selectedCertificationEntryIds: { type: "array", maxItems: 30, items: { type: "string" } },
    selectedLanguageEntryIds: { type: "array", maxItems: 20, items: { type: "string" } },
    sectionOrder: {
      type: "array",
      maxItems: 7,
      items: { type: "string", enum: [...RESUME_DRAFT_SECTION_NAMES] },
    },
    hiddenSections: { type: "array", maxItems: 7, items: { type: "string", enum: [...RESUME_DRAFT_SECTION_NAMES] } },
    userEditedContentIds: { type: "array", maxItems: 120, items: { type: "string" } },
    warnings: { type: "array", maxItems: 12, items: { type: "string", maxLength: 240 } },
  },
} as const satisfies AiJsonSchema;

function draftSentenceJsonSchema(): AiJsonSchema {
  return {
    type: "object",
    additionalProperties: false,
    required: ["id", "text", "sourceFactIds"],
    properties: {
      id: { type: "string" },
      text: { type: "string", maxLength: 420 },
      sourceFactIds: { type: "array", maxItems: 30, items: { type: "string" } },
    },
  };
}

function draftEntryJsonSchema(): AiJsonSchema {
  return {
    type: "object",
    additionalProperties: false,
    required: ["entryId", "bullets"],
    properties: {
      entryId: { type: "string" },
      bullets: { type: "array", maxItems: 30, items: draftSentenceJsonSchema() },
    },
  };
}
