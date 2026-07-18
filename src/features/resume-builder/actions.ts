"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";

import { resumeProfileSchema, type GroundedString, type ResumeProfile } from "@/lib/resume-builder/resume-profile-schema";
import { extractResumeProfileWithAi } from "@/lib/resume-builder/resume-profile-extraction-ai";
import { getResumeProfileForScan, upsertResumeProfileForScan } from "@/lib/resume-builder/resume-profile-repository";
import { deleteResumeDraftForScan, upsertResumeDraftForScan } from "@/lib/resume-builder/resume-draft-repository";
import { generateGroundedResumeDraftForScan } from "@/lib/resume-builder/generate-grounded-resume-draft";
import {
  ADDITIONAL_TECHNICAL_SKILLS_CATEGORY,
  evaluateResumeProfile,
  preserveUserProvidedResumeFacts,
} from "@/lib/resume-builder/resume-profile-utils";
import { confirmCandidateFacts } from "@/lib/resume-builder/resume-profile-review";
import { resumeDraftSchema } from "@/lib/resume-builder/resume-draft-schema";
import { checkUsageActionLimit, consumeUsageAction } from "@/lib/security/usage-limits";
import { createClient } from "@/lib/supabase/server";
import { parseSkillItems } from "@/features/feedback/types";
import {
  detectResumeLanguage,
  resumeLanguageSchema,
} from "@/lib/resume-builder/resume-language";
import { classifyResumeRequirement } from "@/lib/resume-builder/resume-requirement";

type ActionResult<T = Record<string, never>> =
  | { ok: true; data: T }
  | { ok: false; error: { code: string; message: string } };

const uuid = (value: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);

export async function initializeResumeProfileAction(scanId: string): Promise<ActionResult> {
  const context = await getCompletedScanWithResult(scanId);
  if (!context.ok) return context;
  const existing = await getResumeProfileForScan(scanId);
  if (!existing.ok) return existing;
  if (existing.data) return { ok: true, data: {} };
  if (!context.data.cvText) return failure("PROFILE_INITIALIZATION_FAILED", "We could not read the CV text needed to prepare your review.");

  const limit = await checkUsageActionLimit({ userId: context.data.userId, action: "resume_profile_initialization" });
  if (!limit.ok) return failure(limit.errorCode, limit.message);
  const consume = await consumeUsageAction({ userId: context.data.userId, action: "resume_profile_initialization" });
  if (!consume.ok) return failure(consume.errorCode, consume.message);

  const extraction = await extractResumeProfileWithAi({
    scanId,
    cvText: context.data.cvText,
  });
  if (!extraction.ok) {
    return failure(extraction.error.code, extraction.error.message);
  }

  const saved = await upsertResumeProfileForScan(
    scanId,
    extraction.data.profile,
    {
      language: detectResumeLanguage(context.data.cvText),
      source: "detected",
    }
  );
  if (!saved.ok) return saved;
  revalidateResumePaths(scanId);
  return { ok: true, data: {} };
}

export async function refreshResumeProfileAction(scanId: string): Promise<ActionResult> {
  const context = await getCompletedScanWithResult(scanId);
  if (!context.ok) return context;
  if (!context.data.cvText) {
    return failure("PROFILE_INITIALIZATION_FAILED", "We could not read the CV text needed to prepare your resume.");
  }

  const existing = await getResumeProfileForScan(scanId);
  if (!existing.ok) return existing;

  const limit = await checkUsageActionLimit({
    userId: context.data.userId,
    action: "resume_profile_initialization",
  });
  if (!limit.ok) return failure(limit.errorCode, limit.message);
  const consume = await consumeUsageAction({
    userId: context.data.userId,
    action: "resume_profile_initialization",
  });
  if (!consume.ok) return failure(consume.errorCode, consume.message);

  const extraction = await extractResumeProfileWithAi({ scanId, cvText: context.data.cvText });
  if (!extraction.ok) return failure(extraction.error.code, extraction.error.message);

  const profile = existing.data
    ? preserveUserProvidedResumeFacts(extraction.data.profile, existing.data.profile)
    : extraction.data.profile;
  const saved = await upsertResumeProfileForScan(
    scanId,
    profile,
    {
      language:
        existing.data?.resumeLanguageSource === "user_selected"
          ? existing.data.resumeLanguage
          : detectResumeLanguage(context.data.cvText),
      source:
        existing.data?.resumeLanguageSource === "user_selected"
          ? "user_selected"
          : "detected",
    }
  );
  if (!saved.ok) return saved;

  const deleted = await deleteResumeDraftForScan(scanId);
  if (!deleted.ok) return deleted;
  revalidateResumePaths(scanId);
  return { ok: true, data: {} };
}

export async function setResumeLanguageAction(input: {
  scanId: string;
  language: string;
}): Promise<ActionResult<{ draftCleared: boolean }>> {
  if (!uuid(input.scanId)) {
    return failure("INVALID_INPUT", "We could not update the resume language.");
  }
  const language = resumeLanguageSchema.safeParse(input.language);
  if (!language.success) {
    return failure("INVALID_INPUT", "Choose English or French for your resume.");
  }

  const stored = await getResumeProfileForScan(input.scanId);
  if (!stored.ok || !stored.data) {
    return failure("RESUME_PROFILE_NOT_FOUND", "We could not find a resume profile for this scan.");
  }

  const languageChanged = stored.data.resumeLanguage !== language.data;
  const saved = await upsertResumeProfileForScan(
    input.scanId,
    stored.data.profile,
    { language: language.data, source: "user_selected" }
  );
  if (!saved.ok) return saved;

  if (languageChanged) {
    const deleted = await deleteResumeDraftForScan(input.scanId);
    if (!deleted.ok) return deleted;
  }

  revalidateResumePaths(input.scanId);
  return { ok: true, data: { draftCleared: languageChanged } };
}

export async function reviewResumeFactAction(input: {
  scanId: string;
  factId: string;
  decision: "confirm" | "edit" | "remove";
  value?: string;
}): Promise<ActionResult<{ readiness: ReturnType<typeof evaluateResumeProfile> }>> {
  if (!uuid(input.scanId) || !uuid(input.factId)) return failure("INVALID_INPUT", "We could not update that information.");
  const stored = await getResumeProfileForScan(input.scanId);
  if (!stored.ok || !stored.data) return failure("RESUME_PROFILE_NOT_FOUND", "We could not find a resume profile for this scan.");
  const next = transformProfileFact(stored.data.profile, input);
  if (!next) return failure("INVALID_INPUT", "We could not update that information.");
  const saved = await upsertResumeProfileForScan(input.scanId, next);
  if (!saved.ok) return saved;
  revalidateResumePaths(input.scanId);
  return { ok: true, data: { readiness: evaluateResumeProfile(saved.data.profile) } };
}

export async function confirmResumeFactsAction(input: {
  scanId: string;
  factIds: string[];
}): Promise<
  ActionResult<{ readiness: ReturnType<typeof evaluateResumeProfile> }>
> {
  const uniqueIds = new Set(input.factIds);
  if (
    !uuid(input.scanId) ||
    input.factIds.length < 1 ||
    input.factIds.length > 200 ||
    uniqueIds.size !== input.factIds.length ||
    input.factIds.some((factId) => !uuid(factId))
  ) {
    return failure(
      "INVALID_INPUT",
      "We could not confirm the selected information."
    );
  }

  const stored = await getResumeProfileForScan(input.scanId);
  if (!stored.ok || !stored.data) {
    return failure(
      "RESUME_PROFILE_NOT_FOUND",
      "We could not find a resume profile for this scan."
    );
  }

  const next = confirmCandidateFacts(stored.data.profile, input.factIds);
  if (!next) {
    return failure(
      "INVALID_INPUT",
      "Some selected information changed. Refresh and try again."
    );
  }

  const saved = await upsertResumeProfileForScan(input.scanId, next);
  if (!saved.ok) return saved;
  revalidateResumePaths(input.scanId);
  return {
    ok: true,
    data: { readiness: evaluateResumeProfile(saved.data.profile) },
  };
}

export async function confirmMissingRequirementAction(input: {
  scanId: string;
  requirement: string;
  category?: string | null;
  answer: "yes" | "limited" | "no";
  evidence?: string;
  skillCategory?: string;
  targetEntryId?: string;
}): Promise<ActionResult> {
  if (!uuid(input.scanId) || input.requirement.trim().length === 0) {
    return failure(
      "INVALID_INPUT",
      "We could not save that requirement confirmation."
    );
  }
  const context = await getCompletedScanWithResult(input.scanId);
  if (!context.ok) return context;
  const normalizedRequirement = input.requirement.trim().toLocaleLowerCase("en");
  const normalizedCategory = input.category?.trim().toLocaleLowerCase("en") ?? null;
  const missing = [
    ...parseSkillItems(context.data.missingRequired),
    ...parseSkillItems(context.data.missingPreferred),
  ].find(
    (item) =>
      item.requirement.toLocaleLowerCase("en") === normalizedRequirement &&
      (normalizedCategory === null ||
        item.category?.toLocaleLowerCase("en") === normalizedCategory)
  );
  if (!missing) {
    return failure(
      "INVALID_INPUT",
      "This requirement is not part of the scan feedback."
    );
  }
  if (input.answer === "no") return { ok: true, data: {} };
  const evidence = input.evidence?.trim() ?? "";
  if (evidence.length < 10 || evidence.length > 600) {
    return failure(
      "REQUIREMENT_EVIDENCE_REQUIRED",
      "Add a short factual description that supports this requirement."
    );
  }
  const stored = await getResumeProfileForScan(input.scanId);
  if (!stored.ok || !stored.data) {
    return failure(
      "RESUME_PROFILE_NOT_FOUND",
      "Review your CV information before confirming requirements."
    );
  }
  const profile = structuredClone(stored.data.profile);
  const kind = classifyResumeRequirement({
    requirement: missing.requirement,
    category: missing.category,
  });

  if (kind !== "skill") {
    const targetEntryId = input.targetEntryId?.trim() ?? "";
    if (!uuid(targetEntryId)) {
      return failure(
        "REQUIREMENT_EVIDENCE_TARGET_REQUIRED",
        `Choose the ${kind} entry that supports this requirement.`
      );
    }

    const attached = attachRequirementEvidence({
      profile,
      kind,
      targetEntryId,
      evidence,
    });
    if (!attached) {
      return failure(
        "INVALID_INPUT",
        `Choose a valid ${kind} entry from your CV information.`
      );
    }

    const saved = await upsertResumeProfileForScan(input.scanId, profile);
    if (!saved.ok) return saved;
    revalidateResumePaths(input.scanId);
    return { ok: true, data: {} };
  }

  const requestedCategory = input.skillCategory?.trim() || ADDITIONAL_TECHNICAL_SKILLS_CATEGORY;
  const allowedCategories = new Set([
    ADDITIONAL_TECHNICAL_SKILLS_CATEGORY.toLocaleLowerCase("en"),
    ...profile.skills.map((group) => group.category.value.toLocaleLowerCase("en")),
  ]);
  if (
    requestedCategory.length > 120 ||
    !allowedCategories.has(requestedCategory.toLocaleLowerCase("en"))
  ) {
    return failure("INVALID_INPUT", "Choose an existing skill category or Additional technical skills.");
  }
  const group = profile.skills.find(
    (item) =>
      item.category.value.toLocaleLowerCase("en") ===
      requestedCategory.toLocaleLowerCase("en")
  ) ?? {
    id: randomUUID(),
    category: userFact(ADDITIONAL_TECHNICAL_SKILLS_CATEGORY, "skills.category"),
    items: [],
  };
  if (!profile.skills.some((item) => item.id === group.id)) profile.skills.push(group);
  if (!group.items.some((item) => item.value.toLocaleLowerCase("en") === normalizedRequirement)) {
    group.items.push({ ...userFact(input.requirement.trim(), "skill_confirmation"), sources: [{ kind: "user_input", section: "skill_confirmation", excerpt: evidence }] });
  }
  const saved = await upsertResumeProfileForScan(input.scanId, profile);
  if (!saved.ok) return saved;
  revalidateResumePaths(input.scanId);
  return { ok: true, data: {} };
}

function attachRequirementEvidence({
  profile,
  kind,
  targetEntryId,
  evidence,
}: {
  profile: ResumeProfile;
  kind: "experience" | "education" | "certification" | "language";
  targetEntryId: string;
  evidence: string;
}): boolean {
  if (kind === "experience") {
    const entry = profile.experience.find((item) => item.id === targetEntryId);
    if (!entry) return false;
    entry.bullets ??= [];
    if (
      !entry.bullets.some(
        (bullet) =>
          bullet.value.trim().toLocaleLowerCase("en") ===
          evidence.toLocaleLowerCase("en")
      )
    ) {
      entry.bullets.push(
        userFact(evidence, "requirement_confirmation.experience")
      );
    }
    return true;
  }

  if (kind === "education") {
    const entry = profile.education.find((item) => item.id === targetEntryId);
    const fact = entry?.degree ?? entry?.fieldOfStudy ?? entry?.institution;
    return addConfirmationProvenance(
      fact,
      evidence,
      "requirement_confirmation.education"
    );
  }

  if (kind === "certification") {
    const entry = profile.certifications.find((item) => item.id === targetEntryId);
    return addConfirmationProvenance(
      entry?.name,
      evidence,
      "requirement_confirmation.certification"
    );
  }

  const entry = profile.languages.find((item) => item.id === targetEntryId);
  return addConfirmationProvenance(
    entry?.language,
    evidence,
    "requirement_confirmation.language"
  );
}

function addConfirmationProvenance(
  fact: GroundedString | null | undefined,
  evidence: string,
  section: string
): boolean {
  if (!fact) return false;
  const alreadyRecorded = fact.sources.some(
    (source) =>
      source.kind === "user_input" &&
      source.section === section &&
      source.excerpt === evidence
  );
  if (!alreadyRecorded) {
    if (fact.sources.length >= 8) {
      const replaceableIndex = fact.sources.findIndex(
        (source) =>
          source.kind === "user_input" &&
          source.section?.startsWith("requirement_confirmation.")
      );
      if (replaceableIndex < 0) return false;
      fact.sources.splice(replaceableIndex, 1);
    }
    fact.sources.push({ kind: "user_input", section, excerpt: evidence });
  }
  if (fact.verificationStatus !== "user_provided") {
    fact.verificationStatus = "confirmed";
  }
  return true;
}

export async function addManualProfileFactAction(input: {
  scanId: string;
  field: "fullName" | "professionalTitle" | "email" | "phone" | "location" | "linkedin" | "github" | "portfolio" | "summary";
  value: string;
}): Promise<ActionResult> {
  if (!uuid(input.scanId) || input.value.trim().length === 0 || input.value.trim().length > 600) {
    return failure("INVALID_INPUT", "Add a valid value before saving.");
  }
  const stored = await getResumeProfileForScan(input.scanId);
  if (!stored.ok || !stored.data) return failure("RESUME_PROFILE_NOT_FOUND", "We could not find a resume profile for this scan.");
  const profile = structuredClone(stored.data.profile);
  const fact = userFact(input.value.trim(), input.field);
  if (input.field === "summary") {
    profile.summary = fact;
  } else {
    profile.basics[input.field] = fact as never;
  }
  const saved = await upsertResumeProfileForScan(input.scanId, profile);
  if (!saved.ok) return saved;
  revalidateResumePaths(input.scanId);
  return { ok: true, data: {} };
}

export async function generateResumeDraftAction(scanId: string): Promise<ActionResult<{ scanId: string }>> {
  const result = await generateGroundedResumeDraftForScan(scanId);
  if (!result.ok) return result;
  revalidateResumePaths(scanId);
  return { ok: true, data: { scanId } };
}

export async function saveResumeDraftAction(scanId: string, draftData: unknown): Promise<ActionResult> {
  if (!uuid(scanId) || !resumeDraftSchema.safeParse(draftData).success) return failure("INVALID_RESUME_DRAFT", "The resume changes could not be validated.");
  const saved = await upsertResumeDraftForScan(scanId, draftData);
  if (!saved.ok) return saved;
  revalidateResumePaths(scanId);
  return { ok: true, data: {} };
}

function transformProfileFact(profile: ResumeProfile, input: { factId: string; decision: "confirm" | "edit" | "remove"; value?: string }): ResumeProfile | null {
  let matched = false;
  const removed = Symbol("removed");
  const apply = (value: unknown): unknown | typeof removed => {
    if (Array.isArray(value)) return value.map(apply).filter((item) => item !== removed);
    if (!value || typeof value !== "object") return value;
    if (isFact(value) && value.id === input.factId) {
      matched = true;
      if (input.decision === "remove") return removed;
      if (input.decision === "confirm") return { ...value, verificationStatus: "confirmed", sources: [...value.sources, { kind: "user_input", section: "user_confirmation" }] };
      const text = input.value?.trim() ?? "";
      return text ? userFact(text, "user_edit") : value;
    }
    const nextObject = Object.fromEntries(Object.entries(value).map(([key, nested]) => {
      const next = apply(nested);
      return [key, next === removed ? null : next];
    }));
    const record = nextObject as Record<string, unknown>;
    if (Array.isArray(record.items) && record.items.length === 0) return removed;
    if (("name" in record && record.name === null) || ("language" in record && record.language === null)) return removed;
    return nextObject;
  };
  const transformed = apply(profile);
  if (!matched || transformed === removed) return null;
  const parsed = resumeProfileSchema.safeParse(transformed);
  return parsed.success ? parsed.data : null;
}

function userFact(value: string, section: string): GroundedString {
  return { id: randomUUID(), value, verificationStatus: "user_provided", sources: [{ kind: "user_input", section }] };
}

function isFact(value: object): value is GroundedString {
  return "id" in value && "value" in value && "verificationStatus" in value && "sources" in value;
}

async function getCompletedScanWithResult(scanId: string): Promise<ActionResult<{ userId: string; cvText: string | null; missingRequired: unknown; missingPreferred: unknown }>> {
  if (!uuid(scanId)) return failure("INVALID_INPUT", "We could not find this scan.");
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return failure("UNAUTHORIZED", "You need to sign in again.");
  const { data: scan } = await supabase.from("scans").select("id, current_status").eq("id", scanId).eq("user_id", user.id).maybeSingle<{ id: string; current_status: string }>();
  if (!scan) return failure("SCAN_NOT_FOUND", "We could not find this scan.");
  if (scan.current_status !== "completed") return failure("SCAN_NOT_COMPLETED", "This scan is not ready for a tailored resume.");
  const { data: result } = await supabase.from("scan_results").select("cv_extracted_text, ai_validation_status, missing_required_skills, missing_preferred_skills").eq("scan_id", scanId).eq("user_id", user.id).maybeSingle<{ cv_extracted_text: string | null; ai_validation_status: string; missing_required_skills: unknown; missing_preferred_skills: unknown }>();
  if (!result || result.ai_validation_status !== "valid") return failure("SCAN_RESULT_NOT_READY", "The scan result is not ready to use.");
  return { ok: true, data: { userId: user.id, cvText: result.cv_extracted_text, missingRequired: result.missing_required_skills, missingPreferred: result.missing_preferred_skills } };
}

function revalidateResumePaths(scanId: string) { revalidatePath(`/scan/${scanId}/resume`); revalidatePath(`/scan/${scanId}`); }
function failure(code: string, message: string): ActionResult<never> { return { ok: false, error: { code, message } }; }
