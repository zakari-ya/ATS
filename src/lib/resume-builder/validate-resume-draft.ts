import type {
  GroundedString,
  ResumeProfile,
} from "@/lib/resume-builder/resume-profile-schema";
import {
  isTrustedValue,
  type ResumeReadyProfile,
} from "@/lib/resume-builder/resume-profile-utils";
import {
  type ResumeDraft,
} from "@/lib/resume-builder/resume-draft-schema";

export type ResumeDraftGroundingError = { path: string; message: string };

export type ResumeDraftGroundingValidation = {
  valid: boolean;
  errors: ResumeDraftGroundingError[];
  warnings: string[];
};

type FactScope = "global" | "experience" | "project";
type TrustedFact = { value: GroundedString; scope: FactScope; entryId?: string };

const CONTACT_VALUE_PATTERN = /\b[\w.+-]+@[\w-]+\.[\w.-]+\b|(?:\+?\d[\d\s().-]{6,}\d)/;
const URL_PATTERN = /(?:https?:\/\/|www\.)\S+/i;
const NUMBER_PATTERN = /(?:[$€£]\s?\d[\d,.]*|\b\d+(?:[,.]\d+)?(?:\s?%|[kKmMbB])?\b)/g;

export function validateGroundedResumeDraft(
  profile: ResumeReadyProfile,
  draft: ResumeDraft
): ResumeDraftGroundingValidation {
  const errors: ResumeDraftGroundingError[] = [];
  const facts = collectTailoringFacts(profile);

  validateUnique(draft.selectedSkillIds, "selectedSkillIds", errors);
  validateUnique(draft.selectedEducationEntryIds, "selectedEducationEntryIds", errors);
  validateUnique(draft.selectedCertificationEntryIds, "selectedCertificationEntryIds", errors);
  validateUnique(draft.selectedLanguageEntryIds, "selectedLanguageEntryIds", errors);
  validateUnique(draft.sectionOrder, "sectionOrder", errors);
  validateUnique(draft.hiddenSections, "hiddenSections", errors);
  validateUnique(draft.userEditedContentIds, "userEditedContentIds", errors);
  validateUnique(
    [
      ...draft.summarySentences.map((sentence) => sentence.id),
      ...draft.experience.flatMap((entry) => entry.bullets.map((bullet) => bullet.id)),
      ...draft.projects.flatMap((entry) => entry.bullets.map((bullet) => bullet.id)),
    ],
    "generatedContentIds",
    errors
  );

  for (const [index, skillId] of draft.selectedSkillIds.entries()) {
    const skill = profile.skills.flatMap((group) => group.items).find((item) => item.id === skillId);
    if (!skill || !isTrustedValue(skill)) {
      addError(errors, `selectedSkillIds[${index}]`, "Selected skills must be trusted profile skills.");
    }
  }

  validateEntrySelection(profile.education, draft.selectedEducationEntryIds, "selectedEducationEntryIds", errors);
  validateEntrySelection(profile.certifications, draft.selectedCertificationEntryIds, "selectedCertificationEntryIds", errors);
  validateEntrySelection(profile.languages, draft.selectedLanguageEntryIds, "selectedLanguageEntryIds", errors);
  validateTextItems(draft.summarySentences, facts, "global", undefined, "summarySentences", errors);
  validateDraftEntries(profile, draft.experience, facts, "experience", "experience", errors);
  validateDraftEntries(profile, draft.projects, facts, "project", "projects", errors);

  return { valid: errors.length === 0, errors, warnings: draft.warnings };
}

function validateDraftEntries(
  profile: ResumeProfile,
  entries: ResumeDraft["experience"],
  facts: Map<string, TrustedFact>,
  scope: "experience" | "project",
  path: string,
  errors: ResumeDraftGroundingError[]
): void {
  const sourceEntries = scope === "experience" ? profile.experience : profile.projects;
  validateUnique(entries.map((entry) => entry.entryId), `${path}.entryId`, errors);

  for (const [index, entry] of entries.entries()) {
    if (!sourceEntries.some((item) => item.id === entry.entryId)) {
      addError(errors, `${path}[${index}].entryId`, "The selected entry does not belong to this resume profile.");
      continue;
    }
    validateTextItems(entry.bullets, facts, scope, entry.entryId, `${path}[${index}].bullets`, errors);
  }
}

function validateTextItems(
  items: ResumeDraft["summarySentences"],
  facts: Map<string, TrustedFact>,
  scope: FactScope,
  entryId: string | undefined,
  path: string,
  errors: ResumeDraftGroundingError[]
): void {
  validateUnique(items.map((item) => item.id), `${path}.id`, errors);
  for (const [index, item] of items.entries()) {
    validateUnique(item.sourceFactIds, `${path}[${index}].sourceFactIds`, errors);
    const citedFacts = item.sourceFactIds.map((factId) => facts.get(factId));

    for (const [factIndex, trustedFact] of citedFacts.entries()) {
      if (!trustedFact) {
        addError(errors, `${path}[${index}].sourceFactIds[${factIndex}]`, "Referenced fact ID is not trusted for this profile.");
      } else if (scope !== "global" && (trustedFact.scope !== scope || trustedFact.entryId !== entryId)) {
        addError(errors, `${path}[${index}].sourceFactIds[${factIndex}]`, "A rewritten bullet may only cite facts from its own entry.");
      }
    }

    if (URL_PATTERN.test(item.text)) addError(errors, `${path}[${index}].text`, "Generated text must not include URLs.");
    if (CONTACT_VALUE_PATTERN.test(item.text)) addError(errors, `${path}[${index}].text`, "Generated text must not include contact information.");
    if (!hasOnlyCitedNumbers(item.text, citedFacts.filter(isDefined).map((fact) => fact.value.value))) {
      addError(errors, `${path}[${index}].text`, "Generated numerical claims must appear in cited trusted facts.");
    }
  }
}

function validateEntrySelection(
  entries: Array<{ id: string }>,
  selectedIds: string[],
  path: string,
  errors: ResumeDraftGroundingError[]
): void {
  for (const [index, entryId] of selectedIds.entries()) {
    if (!entries.some((entry) => entry.id === entryId)) {
      addError(errors, `${path}[${index}]`, "The selected entry does not belong to this resume profile.");
    }
  }
}

function validateUnique(values: string[], path: string, errors: ResumeDraftGroundingError[]): void {
  const seen = new Set<string>();
  values.forEach((value, index) => {
    if (seen.has(value)) addError(errors, `${path}[${index}]`, "Duplicate IDs are not allowed.");
    seen.add(value);
  });
}

function collectTailoringFacts(profile: ResumeProfile): Map<string, TrustedFact> {
  const facts = new Map<string, TrustedFact>();
  const add = (value: GroundedString | null | undefined, scope: FactScope, entryId?: string) => {
    if (value && isTrustedValue(value)) facts.set(value.id, { value, scope, entryId });
  };

  // Contact values are intentionally omitted: generated text cannot cite them.
  add(profile.basics.professionalTitle, "global");
  add(profile.basics.location, "global");
  add(profile.summary, "global");
  profile.skills.forEach((group) => {
    add(group.category, "global");
    group.items.forEach((item) => add(item, "global"));
  });
  profile.experience.forEach((entry) => {
    [entry.role, entry.company, entry.location, entry.dateLabel, ...(entry.bullets ?? [])]
      .forEach((value) => add(value, "experience", entry.id));
  });
  profile.projects.forEach((entry) => {
    [entry.name, entry.subtitle, entry.projectType, entry.dateLabel, ...(entry.technologies ?? []), ...(entry.bullets ?? [])]
      .forEach((value) => add(value, "project", entry.id));
  });
  return facts;
}

function hasOnlyCitedNumbers(text: string, citedValues: string[]): boolean {
  const allowed = new Set(citedValues.flatMap((value) => extractNumbers(value).map(normalizeNumber)));
  return extractNumbers(text).every((value) => allowed.has(normalizeNumber(value)));
}

function extractNumbers(value: string): string[] {
  return value.match(NUMBER_PATTERN) ?? [];
}

function normalizeNumber(value: string): string {
  return value.toLowerCase().replace(/[\s,]/g, "");
}

function addError(errors: ResumeDraftGroundingError[], path: string, message: string): void {
  errors.push({ path, message });
}

function isDefined<T>(value: T | undefined): value is T {
  return value !== undefined;
}
