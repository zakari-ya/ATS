import { randomUUID } from "node:crypto";

import {
  resumeDraftSchema,
  type ResumeDraft,
} from "@/lib/resume-builder/resume-draft-schema";
import type { GroundedString } from "@/lib/resume-builder/resume-profile-schema";
import type { ResumeReadyProfile } from "@/lib/resume-builder/resume-profile-utils";
import { validateGroundedResumeDraft } from "@/lib/resume-builder/validate-resume-draft";
import type { AiCvMatchResponse } from "@/types/ai";

export function buildGroundedFallbackDraft({
  profile,
  aiAnalysis,
}: {
  profile: ResumeReadyProfile;
  aiAnalysis: AiCvMatchResponse;
}): ResumeDraft {
  const matchedRequirements = new Set(
    aiAnalysis.match_matrix
      .filter((item) =>
        ["exact_match", "semantic_match", "partial_match"].includes(
          item.match_status
        )
      )
      .map((item) => normalizeName(item.requirement))
  );
  const skills = uniqueById(profile.skills.flatMap((group) => group.items));
  const relevantSkills = skills.filter((skill) =>
    matchedRequirements.has(normalizeName(skill.value))
  );
  const remainingSkills = skills.filter(
    (skill) => !relevantSkills.some((relevant) => relevant.id === skill.id)
  );

  const draft: ResumeDraft = {
    schemaVersion: 1,
    summarySentences:
      profile.summary && isSafeGeneratedText(profile.summary.value)
      ? draftItemsForFact(profile.summary).slice(0, 6)
      : [],
    selectedSkillIds: [...relevantSkills, ...remainingSkills]
      .slice(0, 120)
      .map((skill) => skill.id),
    experience: uniqueById(profile.experience).flatMap((entry) => {
      const sourceFacts = entry.bullets?.some((fact) =>
        isSafeGeneratedText(fact.value)
      )
        ? entry.bullets.filter((fact) => isSafeGeneratedText(fact.value))
        : [entry.role, entry.company].filter(
            (fact): fact is NonNullable<typeof fact> =>
              Boolean(fact && isSafeGeneratedText(fact.value))
          );
      return sourceFacts.length
        ? [
            {
              entryId: entry.id,
              bullets: sourceFacts
                .flatMap(draftItemsForFact)
                .slice(0, 30),
            },
          ]
        : [];
    }),
    projects: uniqueById(profile.projects).flatMap((entry) => {
      const sourceFacts = entry.bullets?.some((fact) =>
        isSafeGeneratedText(fact.value)
      )
        ? entry.bullets.filter((fact) => isSafeGeneratedText(fact.value))
        : [entry.subtitle, entry.projectType, entry.name].filter(
            (fact): fact is NonNullable<typeof fact> =>
              Boolean(fact && isSafeGeneratedText(fact.value))
          ).slice(0, 1);
      return sourceFacts.length
        ? [
            {
              entryId: entry.id,
              bullets: sourceFacts
                .flatMap(draftItemsForFact)
                .slice(0, 30),
            },
          ]
        : [];
    }),
    selectedEducationEntryIds: uniqueById(profile.education).map(
      (entry) => entry.id
    ),
    selectedCertificationEntryIds: uniqueById(profile.certifications).map(
      (entry) => entry.id
    ),
    selectedLanguageEntryIds: uniqueById(profile.languages).map(
      (entry) => entry.id
    ),
    sectionOrder: [
      "summary",
      "skills",
      "experience",
      "projects",
      "education",
      "certifications",
      "languages",
    ],
    hiddenSections: [],
    userEditedContentIds: [],
    warnings: [
      "Original verified wording was used because AI tailoring was unavailable.",
    ],
  };

  const parsed = resumeDraftSchema.safeParse(draft);
  if (!parsed.success) {
    throw new Error("Grounded fallback draft schema validation failed.");
  }

  const validation = validateGroundedResumeDraft(profile, parsed.data);
  if (!validation.valid) {
    throw new Error("Grounded fallback draft validation failed.");
  }

  return parsed.data;
}

function normalizeName(value: string): string {
  return value.normalize("NFKC").trim().toLocaleLowerCase("en");
}

function isSafeGeneratedText(value: string): boolean {
  const hasContact =
    /\b[\w.+-]+@[\w-]+\.[\w.-]+\b|(?:\+?\d[\d\s().-]{6,}\d)/.test(value);
  const hasUrl = /(?:https?:\/\/|www\.)\S+/i.test(value);
  return !hasContact && !hasUrl;
}

function draftItemsForFact(fact: GroundedString) {
  return splitTrustedText(fact.value).map((text) => ({
    id: randomUUID(),
    text,
    sourceFactIds: [fact.id],
  }));
}

/** Keep fallback text within the draft contract without rewriting its facts. */
function splitTrustedText(value: string, maxLength = 420): string[] {
  const normalized = value.trim().replace(/\s+/g, " ");
  if (normalized.length <= maxLength) return [normalized];

  const chunks: string[] = [];
  let remaining = normalized;

  while (remaining.length > maxLength) {
    const window = remaining.slice(0, maxLength + 1);
    const sentenceBreak = Math.max(
      window.lastIndexOf(". "),
      window.lastIndexOf("! "),
      window.lastIndexOf("? ")
    );
    const wordBreak = window.lastIndexOf(" ");
    const splitAt =
      sentenceBreak >= Math.floor(maxLength / 2)
        ? sentenceBreak + 1
        : wordBreak > 0
          ? wordBreak
          : maxLength;

    chunks.push(remaining.slice(0, splitAt).trim());
    remaining = remaining.slice(splitAt).trim();
  }

  if (remaining) chunks.push(remaining);
  return chunks;
}

function uniqueById<T extends { id: string }>(values: T[]): T[] {
  const seen = new Set<string>();
  return values.filter((value) => {
    if (seen.has(value.id)) return false;
    seen.add(value.id);
    return true;
  });
}
