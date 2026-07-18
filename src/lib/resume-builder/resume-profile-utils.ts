import {
  resumeProfileSchema,
  type GroundedString,
  type ResumeProfile,
  type ResumeVerificationStatus,
} from "@/lib/resume-builder/resume-profile-schema";

export type ResumeCandidateFact = {
  id: string;
  path: string;
};

export type ResumeProfileEvaluation = {
  isReady: boolean;
  missingRequiredFields: string[];
  candidateFactIds: string[];
  warnings: string[];
};

declare const resumeReadyProfileBrand: unique symbol;

/**
 * A ResumeProfile that has passed the Step 1 trust and readiness checks.
 * It intentionally reuses the same profile model rather than duplicating it.
 */
export type ResumeReadyProfile = ResumeProfile & {
  readonly [resumeReadyProfileBrand]: true;
};

export type ResumeReadyProfileResult =
  | { ok: true; data: ResumeReadyProfile }
  | {
      ok: false;
      error: {
        message: string;
        evaluation?: ResumeProfileEvaluation;
      };
    };

export const ADDITIONAL_TECHNICAL_SKILLS_CATEGORY =
  "Additional technical skills";

const LEGACY_VERIFIED_EXPERIENCE_CATEGORY = "verified experience";

export function isTrustedValue(
  value: Pick<GroundedString, "verificationStatus"> | null | undefined
): boolean {
  return (
    value?.verificationStatus === "cv_verified" ||
    value?.verificationStatus === "confirmed" ||
    value?.verificationStatus === "user_provided"
  );
}

export function collectCandidateFacts(
  profile: ResumeProfile
): ResumeCandidateFact[] {
  return collectFacts(profile, "candidate");
}

export function collectTrustedFactIds(profile: ResumeProfile): string[] {
  return collectFacts(profile, "trusted").map((fact) => fact.id);
}

export function normalizeResumeProfile(profile: ResumeProfile): ResumeProfile {
  const normalized = promoteGroundedCandidates(resumeProfileSchema.parse(profile));
  const seenSkills = new Set<string>();

  return {
    ...normalized,
    skills: mergeEquivalentSkillGroups(normalized.skills)
      .map((group) => ({
        ...group,
        items: group.items.filter((skill) => {
          const key = skill.value.toLocaleLowerCase("en");
          if (seenSkills.has(key)) return false;
          seenSkills.add(key);
          return true;
        }),
      }))
      .filter((group) => group.items.length > 0),
    experience: normalized.experience.map((entry) =>
      removeEmptyOptionalArrays(entry)
    ),
    projects: normalized.projects.map((entry) => removeEmptyOptionalArrays(entry)),
  };
}

/** Retain facts explicitly supplied by the user when CV extraction is refreshed. */
export function preserveUserProvidedResumeFacts(
  extracted: ResumeProfile,
  existing: ResumeProfile
): ResumeProfile {
  const profile = structuredClone(extracted);

  for (const key of [
    "fullName",
    "professionalTitle",
    "email",
    "phone",
    "location",
    "linkedin",
    "github",
    "portfolio",
  ] as const) {
    const previous = existing.basics[key];
    if (previous?.verificationStatus === "user_provided") {
      profile.basics[key] = previous as never;
    }
  }

  if (existing.summary?.verificationStatus === "user_provided") {
    profile.summary = existing.summary;
  }

  const extractedSkillValues = new Set(
    profile.skills
      .flatMap((group) => group.items)
      .map((skill) => skill.value.toLocaleLowerCase("en"))
  );
  for (const existingGroup of mergeEquivalentSkillGroups(existing.skills)) {
    const userSkills = existingGroup.items.filter(
      (skill) =>
        skill.verificationStatus === "user_provided" &&
        !extractedSkillValues.has(skill.value.toLocaleLowerCase("en"))
    );
    if (!userSkills.length) continue;

    const category = canonicalSkillCategory(existingGroup.category.value);
    const group = profile.skills.find(
      (item) =>
        canonicalSkillCategory(item.category.value).toLocaleLowerCase("en") ===
        category.toLocaleLowerCase("en")
    );

    if (group) {
      group.items.push(...userSkills);
      continue;
    }

    profile.skills.push({
      id: crypto.randomUUID(),
      category: { ...existingGroup.category, value: category },
      items: userSkills,
    });
  }

  return normalizeResumeProfile(profile);
}

/**
 * Legacy candidate facts were already accepted only after their value and
 * provenance excerpt were matched against extracted CV text. They can be
 * safely promoted to the current CV-verified trust state.
 */
function promoteGroundedCandidates(profile: ResumeProfile): ResumeProfile {
  const promote = (value: unknown): unknown => {
    if (Array.isArray(value)) return value.map(promote);
    if (!value || typeof value !== "object") return value;

    const record = value as Record<string, unknown>;
    if (isGroundedValue(record) && record.verificationStatus === "candidate") {
      return { ...record, verificationStatus: "cv_verified" };
    }

    return Object.fromEntries(
      Object.entries(value).map(([key, nested]) => [key, promote(nested)])
    );
  };

  return resumeProfileSchema.parse(promote(profile));
}

function mergeEquivalentSkillGroups(
  groups: ResumeProfile["skills"]
): ResumeProfile["skills"] {
  const byCategory = new Map<string, ResumeProfile["skills"][number]>();

  for (const group of groups) {
    const category = canonicalSkillCategory(group.category.value);
    const key = category.toLocaleLowerCase("en");
    const existing = byCategory.get(key);

    if (existing) {
      existing.items.push(...group.items);
      continue;
    }

    byCategory.set(key, {
      ...group,
      category: { ...group.category, value: category },
      items: [...group.items],
    });
  }

  return [...byCategory.values()];
}

function canonicalSkillCategory(category: string): string {
  return category.trim().toLocaleLowerCase("en") ===
    LEGACY_VERIFIED_EXPERIENCE_CATEGORY
    ? ADDITIONAL_TECHNICAL_SKILLS_CATEGORY
    : category;
}

export function evaluateResumeProfile(
  profile: ResumeProfile
): ResumeProfileEvaluation {
  const normalized = normalizeResumeProfile(profile);
  const candidateFacts = collectCandidateFacts(normalized);
  const missingRequiredFields: string[] = [];
  const warnings: string[] = [];

  if (!isTrustedValue(normalized.basics.fullName)) {
    missingRequiredFields.push("Full name");
  }

  const hasTrustedContact = [
    normalized.basics.email,
    normalized.basics.phone,
    normalized.basics.linkedin,
    normalized.basics.github,
    normalized.basics.portfolio,
  ].some(isTrustedValue);

  if (!hasTrustedContact) {
    missingRequiredFields.push("At least one contact method");
  }

  if (!hasMeaningfulTrustedContent(normalized)) {
    missingRequiredFields.push("At least one meaningful content section");
  }

  if (candidateFacts.length > 0) {
    warnings.push(
      "Candidate facts must be confirmed or replaced with user-provided facts before resume generation."
    );
  }

  return {
    isReady: missingRequiredFields.length === 0 && candidateFacts.length === 0,
    missingRequiredFields,
    candidateFactIds: candidateFacts.map((fact) => fact.id),
    warnings,
  };
}

export function createResumeReadyProfile(
  input: unknown
): ResumeReadyProfileResult {
  const parsed = resumeProfileSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: { message: "The resume profile data could not be validated." },
    };
  }

  const normalized = normalizeResumeProfile(parsed.data);
  const evaluation = evaluateResumeProfile(normalized);
  if (!evaluation.isReady) {
    return {
      ok: false,
      error: {
        message: "The resume profile needs trusted facts before it can be used.",
        evaluation,
      },
    };
  }

  return { ok: true, data: normalized as ResumeReadyProfile };
}

function collectFacts(
  value: unknown,
  mode: "candidate" | "trusted",
  path = ""
): ResumeCandidateFact[] {
  if (Array.isArray(value)) {
    return value.flatMap((item, index) =>
      collectFacts(item, mode, `${path}[${index}]`)
    );
  }

  if (!isRecord(value)) return [];

  if (isGroundedValue(value)) {
    const matches =
      mode === "candidate"
        ? value.verificationStatus === "candidate"
        : isTrustedStatus(value.verificationStatus);
    return matches ? [{ id: value.id, path }] : [];
  }

  return Object.entries(value).flatMap(([key, nestedValue]) =>
    collectFacts(nestedValue, mode, path ? `${path}.${key}` : key)
  );
}

function hasMeaningfulTrustedContent(profile: ResumeProfile): boolean {
  return Boolean(
    isTrustedValue(profile.summary) ||
      profile.skills.some((group) => group.items.some(isTrustedValue)) ||
      profile.experience.some((entry) =>
        [entry.role, entry.company, ...(entry.bullets ?? [])].some(isTrustedValue)
      ) ||
      profile.projects.some((entry) =>
        [entry.name, entry.subtitle, ...(entry.bullets ?? [])].some(isTrustedValue)
      ) ||
      profile.education.some((entry) =>
        [entry.institution, entry.degree, entry.fieldOfStudy].some(isTrustedValue)
      ) ||
      profile.certifications.some((entry) =>
        [entry.name, entry.issuer].some(isTrustedValue)
      ) ||
      profile.languages.some((entry) => isTrustedValue(entry.language))
  );
}

function removeEmptyOptionalArrays<
  T extends { bullets?: GroundedString[]; technologies?: GroundedString[] }
>(entry: T): T {
  const normalized = { ...entry };
  if (normalized.bullets?.length === 0) delete normalized.bullets;
  if (normalized.technologies?.length === 0) delete normalized.technologies;
  return normalized;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isGroundedValue(
  value: Record<string, unknown>
): value is GroundedString {
  return (
    typeof value.id === "string" &&
    typeof value.value === "string" &&
    typeof value.verificationStatus === "string" &&
    Array.isArray(value.sources)
  );
}

function isTrustedStatus(
  status: ResumeVerificationStatus
): boolean {
  return (
    status === "cv_verified" ||
    status === "confirmed" ||
    status === "user_provided"
  );
}
