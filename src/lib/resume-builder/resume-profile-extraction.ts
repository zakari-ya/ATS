import { randomUUID } from "node:crypto";

import { z } from "zod";

import type { AiJsonSchema } from "@/lib/ai/client";
import {
  resumeProfileSchema,
  type GroundedString,
  type ResumeProfile,
} from "@/lib/resume-builder/resume-profile-schema";
import {
  isSafeHttpUrl,
  normalizeExtractedHttpUrl,
} from "@/lib/security/safe-url";

const extractedText = z.string().trim().min(1).max(600);
const extractedExcerpt = z.string().trim().min(1).max(700);
const extractedFact = z
  .object({ value: extractedText, excerpt: extractedExcerpt })
  .strict();
const extractedEmail = extractedFact.safeExtend({
  value: z.string().trim().email().max(254),
});
const extractedUrl = extractedFact.safeExtend({
  value: z
    .string()
    .trim()
    .url()
    .max(2048)
    .refine(isSafeHttpUrl),
});
const optionalFact = extractedFact.nullable();
const optionalUrl = extractedUrl.nullable();

const resumeProfileExtractionSchema = z
  .object({
    basics: z
      .object({
        fullName: optionalFact,
        professionalTitle: optionalFact,
        email: extractedEmail.nullable(),
        phone: optionalFact,
        location: optionalFact,
        linkedin: optionalUrl,
        github: optionalUrl,
        portfolio: optionalUrl,
      })
      .strict(),
    summary: optionalFact,
    skills: z
      .array(
        z
          .object({
            category: optionalFact,
            items: z.array(extractedFact).max(80),
          })
          .strict()
      )
      .max(30),
    experience: z
      .array(
        z
          .object({
            role: optionalFact,
            company: optionalFact,
            location: optionalFact,
            dateLabel: optionalFact,
            bullets: z.array(extractedFact).max(30),
          })
          .strict()
      )
      .max(30),
    projects: z
      .array(
        z
          .object({
            name: extractedFact,
            subtitle: optionalFact,
            projectType: optionalFact,
            dateLabel: optionalFact,
            repositoryUrl: optionalUrl,
            liveUrl: optionalUrl,
            technologies: z.array(extractedFact).max(40),
            bullets: z.array(extractedFact).max(30),
          })
          .strict()
      )
      .max(30),
    education: z
      .array(
        z
          .object({
            institution: optionalFact,
            degree: optionalFact,
            fieldOfStudy: optionalFact,
            location: optionalFact,
            dateLabel: optionalFact,
          })
          .strict()
      )
      .max(20),
    certifications: z
      .array(
        z
          .object({
            name: extractedFact,
            issuer: optionalFact,
            dateLabel: optionalFact,
            location: optionalFact,
            credentialUrl: optionalUrl,
          })
          .strict()
      )
      .max(30),
    languages: z
      .array(
        z
          .object({
            language: extractedFact,
            proficiency: optionalFact,
          })
          .strict()
      )
      .max(20),
  })
  .strict();

export const RESUME_EXTRACTION_SECTIONS = [
  "basics.fullName",
  "basics.professionalTitle",
  "basics.email",
  "basics.phone",
  "basics.location",
  "basics.linkedin",
  "basics.github",
  "basics.portfolio",
  "summary",
  "skills.category",
  "skills.item",
  "experience.role",
  "experience.company",
  "experience.location",
  "experience.dateLabel",
  "experience.bullet",
  "projects.name",
  "projects.subtitle",
  "projects.projectType",
  "projects.dateLabel",
  "projects.repositoryUrl",
  "projects.liveUrl",
  "projects.technology",
  "projects.bullet",
  "education.institution",
  "education.degree",
  "education.fieldOfStudy",
  "education.location",
  "education.dateLabel",
  "certifications.name",
  "certifications.issuer",
  "certifications.dateLabel",
  "certifications.location",
  "certifications.credentialUrl",
  "languages.language",
  "languages.proficiency",
] as const;

const providerExtractionFactSchema = z
  .object({
    section: z.enum(RESUME_EXTRACTION_SECTIONS),
    entryIndex: z.number().int().min(0).max(29),
    value: extractedText,
    excerpt: extractedExcerpt,
  })
  .strict();

const providerResumeProfileExtractionSchema = z
  .object({
    schemaVersion: z.literal(1),
    facts: z.array(providerExtractionFactSchema).max(600),
  })
  .strict();

export type ResumeProfileExtraction = z.infer<
  typeof resumeProfileExtractionSchema
>;

export const resumeProfileExtractionJsonSchema = {
  type: "object",
  additionalProperties: false,
  required: ["schemaVersion", "facts"],
  properties: {
    schemaVersion: { type: "number", enum: [1] },
    facts: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["section", "entryIndex", "value", "excerpt"],
        properties: {
          section: { type: "string", enum: [...RESUME_EXTRACTION_SECTIONS] },
          entryIndex: { type: "integer", minimum: 0, maximum: 29 },
          value: { type: "string" },
          excerpt: { type: "string" },
        },
      },
    },
  },
} as const satisfies AiJsonSchema;

export type ResumeProfileExtractionParseResult =
  | { ok: true; data: ResumeProfileExtraction }
  | { ok: false; error: { code: "INVALID_EXTRACTION" } };

export type CandidateProfileBuildResult =
  | { ok: true; data: ResumeProfile }
  | {
      ok: false;
      error: { code: "INVALID_SCAN_ID" | "UNGROUNDED_EXTRACTION" };
    };

export function parseResumeProfileExtraction(
  input: unknown
): ResumeProfileExtractionParseResult {
  const providerOutput = providerResumeProfileExtractionSchema.safeParse(input);
  if (!providerOutput.success) {
    return { ok: false, error: { code: "INVALID_EXTRACTION" } };
  }

  const parsed = resumeProfileExtractionSchema.safeParse(
    expandProviderExtraction(providerOutput.data.facts)
  );
  return parsed.success
    ? { ok: true, data: parsed.data }
    : { ok: false, error: { code: "INVALID_EXTRACTION" } };
}

export function buildCandidateResumeProfile({
  scanId,
  cvText,
  extraction,
}: {
  scanId: string;
  cvText: string;
  extraction: ResumeProfileExtraction;
}): CandidateProfileBuildResult {
  if (!z.string().uuid().safeParse(scanId).success) {
    return { ok: false, error: { code: "INVALID_SCAN_ID" } };
  }

  try {
    const groundedExtraction = keepGroundedExtractionFacts(extraction, cvText);
    const fact = (
      value: { value: string; excerpt: string } | null,
      section: string,
      requireValueInCv = true
    ): GroundedString | null =>
      value
        ? candidateFact(value, section, scanId, cvText, requireValueInCv)
        : null;

    const profile = resumeProfileSchema.parse({
      id: randomUUID(),
      sourceScanId: scanId,
      schemaVersion: 1,
      basics: {
        fullName: fact(groundedExtraction.basics.fullName, "basics.fullName"),
        professionalTitle: fact(
          groundedExtraction.basics.professionalTitle,
          "basics.professionalTitle"
        ),
        email: fact(groundedExtraction.basics.email, "basics.email"),
        phone: fact(groundedExtraction.basics.phone, "basics.phone"),
        location: fact(groundedExtraction.basics.location, "basics.location"),
        linkedin: fact(
          groundedExtraction.basics.linkedin,
          "basics.linkedin",
          false
        ),
        github: fact(groundedExtraction.basics.github, "basics.github", false),
        portfolio: fact(
          groundedExtraction.basics.portfolio,
          "basics.portfolio",
          false
        ),
      },
      summary: fact(groundedExtraction.summary, "summary"),
      skills: groundedExtraction.skills.map((group) => ({
        id: randomUUID(),
        category: group.category
          ? candidateFact(group.category, "skills.category", scanId, cvText)
          : candidateFact(
              {
                value: "Skills",
                excerpt: group.items[0]!.excerpt,
              },
              "skills.category",
              scanId,
              cvText,
              false
            ),
        items: group.items.map((item) =>
          candidateFact(item, "skills.item", scanId, cvText)
        ),
      })),
      experience: groundedExtraction.experience.map((entry) => ({
        id: randomUUID(),
        role: fact(entry.role, "experience.role"),
        company: fact(entry.company, "experience.company"),
        location: fact(entry.location, "experience.location"),
        dateLabel: fact(entry.dateLabel, "experience.dateLabel"),
        bullets: entry.bullets.map((item) =>
          candidateFact(item, "experience.bullet", scanId, cvText)
        ),
      })),
      projects: groundedExtraction.projects.map((entry) => ({
        id: randomUUID(),
        name: candidateFact(entry.name, "projects.name", scanId, cvText),
        subtitle: fact(entry.subtitle, "projects.subtitle"),
        projectType: fact(entry.projectType, "projects.projectType"),
        dateLabel: fact(entry.dateLabel, "projects.dateLabel"),
        repositoryUrl: fact(
          entry.repositoryUrl,
          "projects.repositoryUrl",
          false
        ),
        liveUrl: fact(entry.liveUrl, "projects.liveUrl", false),
        technologies: entry.technologies.map((item) =>
          candidateFact(item, "projects.technology", scanId, cvText)
        ),
        bullets: entry.bullets.map((item) =>
          candidateFact(item, "projects.bullet", scanId, cvText)
        ),
      })),
      education: groundedExtraction.education.map((entry) => ({
        id: randomUUID(),
        institution: fact(entry.institution, "education.institution"),
        degree: fact(entry.degree, "education.degree"),
        fieldOfStudy: fact(entry.fieldOfStudy, "education.fieldOfStudy"),
        location: fact(entry.location, "education.location"),
        dateLabel: fact(entry.dateLabel, "education.dateLabel"),
      })),
      certifications: groundedExtraction.certifications.map((entry) => ({
        id: randomUUID(),
        name: candidateFact(
          entry.name,
          "certifications.name",
          scanId,
          cvText
        ),
        issuer: fact(entry.issuer, "certifications.issuer"),
        dateLabel: fact(entry.dateLabel, "certifications.dateLabel"),
        location: fact(entry.location, "certifications.location"),
        credentialUrl: fact(
          entry.credentialUrl,
          "certifications.credentialUrl",
          false
        ),
      })),
      languages: groundedExtraction.languages.map((entry) => ({
        id: randomUUID(),
        language: candidateFact(
          entry.language,
          "languages.language",
          scanId,
          cvText
        ),
        proficiency: fact(entry.proficiency, "languages.proficiency"),
      })),
    });

    return { ok: true, data: profile };
  } catch {
    return { ok: false, error: { code: "UNGROUNDED_EXTRACTION" } };
  }
}

type ExtractedFact = z.infer<typeof extractedFact>;
type ProviderFact = z.infer<typeof providerExtractionFactSchema>;

function expandProviderExtraction(facts: ProviderFact[]): ResumeProfileExtraction {
  const basics: ResumeProfileExtraction["basics"] = {
    fullName: null,
    professionalTitle: null,
    email: null,
    phone: null,
    location: null,
    linkedin: null,
    github: null,
    portfolio: null,
  };
  let summary: ExtractedFact | null = null;
  const skills = new Map<
    number,
    { category: ExtractedFact | null; items: ExtractedFact[] }
  >();
  const experience = new Map<number, ResumeProfileExtraction["experience"][number]>();
  const projects = new Map<number, Partial<ResumeProfileExtraction["projects"][number]>>();
  const education = new Map<number, ResumeProfileExtraction["education"][number]>();
  const certifications = new Map<number, Partial<ResumeProfileExtraction["certifications"][number]>>();
  const languages = new Map<number, Partial<ResumeProfileExtraction["languages"][number]>>();

  for (const { section, entryIndex, value, excerpt } of facts) {
    const fact = { value, excerpt };
    if (section.startsWith("basics.") && entryIndex === 0) {
      const key = section.slice("basics.".length) as keyof typeof basics;
      const normalizedFact = normalizeSpecialFact(section, fact);
      if (basics[key] === null && normalizedFact) {
        basics[key] = normalizedFact;
      }
      continue;
    }
    if (section === "summary") {
      summary ??= fact;
      continue;
    }
    if (section === "skills.category" || section === "skills.item") {
      const group = mapEntry(skills, entryIndex, () => ({
        category: null,
        items: [],
      }));
      if (section === "skills.category") {
        group.category ??= fact;
      } else {
        group.items.push(fact);
      }
      continue;
    }
    if (section.startsWith("experience.")) {
      const entry = mapEntry(experience, entryIndex, () => ({
        role: null,
        company: null,
        location: null,
        dateLabel: null,
        bullets: [],
      }));
      assignEntryFact(entry, section.slice("experience.".length), fact);
      continue;
    }
    if (section.startsWith("projects.")) {
      const entry = mapEntry(projects, entryIndex, () => ({
        subtitle: null,
        projectType: null,
        dateLabel: null,
        repositoryUrl: null,
        liveUrl: null,
        technologies: [],
        bullets: [],
      }));
      const normalizedFact = normalizeSpecialFact(section, fact);
      if (normalizedFact) {
        assignEntryFact(
          entry,
          section.slice("projects.".length),
          normalizedFact
        );
      }
      continue;
    }
    if (section.startsWith("education.")) {
      const entry = mapEntry(education, entryIndex, () => ({
        institution: null,
        degree: null,
        fieldOfStudy: null,
        location: null,
        dateLabel: null,
      }));
      assignEntryFact(entry, section.slice("education.".length), fact);
      continue;
    }
    if (section.startsWith("certifications.")) {
      const entry = mapEntry(certifications, entryIndex, () => ({
        issuer: null,
        dateLabel: null,
        location: null,
        credentialUrl: null,
      }));
      const normalizedFact = normalizeSpecialFact(section, fact);
      if (normalizedFact) {
        assignEntryFact(
          entry,
          section.slice("certifications.".length),
          normalizedFact
        );
      }
      continue;
    }
    if (section.startsWith("languages.")) {
      const entry = mapEntry(languages, entryIndex, () => ({ proficiency: null }));
      assignEntryFact(entry, section.slice("languages.".length), fact);
    }
  }

  return {
    basics,
    summary,
    skills: orderedValues(skills).filter((group) => group.items.length > 0),
    experience: orderedValues(experience).filter(hasEntryContent),
    projects: orderedValues(projects).filter(hasRequiredName) as ResumeProfileExtraction["projects"],
    education: orderedValues(education).filter(hasEntryContent),
    certifications: orderedValues(certifications).filter(hasRequiredName) as ResumeProfileExtraction["certifications"],
    languages: orderedValues(languages).filter((entry) => "language" in entry) as ResumeProfileExtraction["languages"],
  };
}

function mapEntry<T>(map: Map<number, T>, index: number, create: () => T): T {
  const existing = map.get(index);
  if (existing) return existing;
  const entry = create();
  map.set(index, entry);
  return entry;
}

function assignEntryFact(
  entry: Record<string, unknown>,
  field: string,
  fact: ExtractedFact
): void {
  const key = field === "technology" ? "technologies" : field;
  if (key === "bullet" || key === "technologies") {
    const arrayKey = key === "bullet" ? "bullets" : key;
    (entry[arrayKey] as ExtractedFact[]).push(fact);
    return;
  }
  if (entry[key] === undefined || entry[key] === null) entry[key] = fact;
}

function orderedValues<T>(map: Map<number, T>): T[] {
  return [...map.entries()].sort(([left], [right]) => left - right).map(([, value]) => value);
}

function hasEntryContent(entry: object): boolean {
  return Object.values(entry).some((value) =>
    Array.isArray(value) ? value.length > 0 : value !== null && value !== undefined
  );
}

function hasRequiredName(entry: object): boolean {
  return "name" in entry && entry.name !== null && entry.name !== undefined;
}

function normalizeSpecialFact(
  section: string,
  fact: ExtractedFact
): ExtractedFact | null {
  if (section === "basics.email") {
    return extractedEmail.safeParse(fact).success ? fact : null;
  }
  if (
    section === "basics.linkedin" ||
    section === "basics.github" ||
    section === "basics.portfolio" ||
    section === "projects.repositoryUrl" ||
    section === "projects.liveUrl" ||
    section === "certifications.credentialUrl"
  ) {
    const value = normalizeExtractedHttpUrl(fact.value);
    if (!value) return null;
    const normalizedFact = { ...fact, value };
    return extractedUrl.safeParse(normalizedFact).success
      ? normalizedFact
      : null;
  }
  return fact;
}

function keepGroundedExtractionFacts(
  extraction: ResumeProfileExtraction,
  cvText: string
): ResumeProfileExtraction {
  const keep = (fact: ExtractedFact | null, requireValue = true) =>
    fact && isGrounded(fact, cvText, requireValue) ? fact : null;
  const keepList = (facts: ExtractedFact[]) =>
    facts.filter((fact) => isGrounded(fact, cvText));
  const keepUrl = (fact: ExtractedFact | null) =>
    fact && isGroundedUrl(fact, cvText) ? fact : null;

  return {
    basics: {
      fullName: keep(extraction.basics.fullName),
      professionalTitle: keep(extraction.basics.professionalTitle),
      email: keep(extraction.basics.email),
      phone: keep(extraction.basics.phone),
      location: keep(extraction.basics.location),
      linkedin: keepUrl(extraction.basics.linkedin),
      github: keepUrl(extraction.basics.github),
      portfolio: keepUrl(extraction.basics.portfolio),
    },
    summary: keep(extraction.summary),
    skills: extraction.skills
      .map((group) => ({
        category: keep(group.category),
        items: keepList(group.items),
      }))
      .filter((group) => group.items.length > 0),
    experience: extraction.experience
      .map((entry) => ({
        role: keep(entry.role),
        company: keep(entry.company),
        location: keep(entry.location),
        dateLabel: keep(entry.dateLabel),
        bullets: keepList(entry.bullets),
      }))
      .filter(hasEntryContent),
    projects: extraction.projects
      .map((entry) => ({
        name: keep(entry.name),
        subtitle: keep(entry.subtitle),
        projectType: keep(entry.projectType),
        dateLabel: keep(entry.dateLabel),
        repositoryUrl: keepUrl(entry.repositoryUrl),
        liveUrl: keepUrl(entry.liveUrl),
        technologies: keepList(entry.technologies),
        bullets: keepList(entry.bullets),
      }))
      .filter(hasRequiredName) as ResumeProfileExtraction["projects"],
    education: extraction.education
      .map((entry) => ({
        institution: keep(entry.institution),
        degree: keep(entry.degree),
        fieldOfStudy: keep(entry.fieldOfStudy),
        location: keep(entry.location),
        dateLabel: keep(entry.dateLabel),
      }))
      .filter(hasEntryContent),
    certifications: extraction.certifications
      .map((entry) => ({
        name: keep(entry.name),
        issuer: keep(entry.issuer),
        dateLabel: keep(entry.dateLabel),
        location: keep(entry.location),
        credentialUrl: keepUrl(entry.credentialUrl),
      }))
      .filter(hasRequiredName) as ResumeProfileExtraction["certifications"],
    languages: extraction.languages
      .map((entry) => ({
        language: keep(entry.language),
        proficiency: keep(entry.proficiency),
      }))
      .filter((entry) => entry.language !== null) as ResumeProfileExtraction["languages"],
  };
}

function isGrounded(
  fact: ExtractedFact,
  cvText: string,
  requireValue = true
): boolean {
  const cv = normalizeForGrounding(cvText);
  const excerpt = normalizeForGrounding(fact.excerpt);
  const value = normalizeForGrounding(fact.value);
  return Boolean(
    excerpt && cv.includes(excerpt) && (!requireValue || cv.includes(value))
  );
}

function isGroundedUrl(fact: ExtractedFact, cvText: string): boolean {
  const cv = normalizeForGrounding(cvText);
  const excerpt = normalizeForGrounding(fact.excerpt);
  const exactValue = normalizeForGrounding(fact.value);
  const withoutScheme = normalizeForGrounding(
    fact.value.replace(/^https?:\/\//i, "")
  );

  return Boolean(
    excerpt &&
      cv.includes(excerpt) &&
      (cv.includes(exactValue) || cv.includes(withoutScheme))
  );
}

function candidateFact(
  extracted: { value: string; excerpt: string },
  section: string,
  scanId: string,
  cvText: string,
  requireValueInCv = true
): GroundedString {
  const normalizedCv = normalizeForGrounding(cvText);
  const normalizedExcerpt = normalizeForGrounding(extracted.excerpt);
  const normalizedValue = normalizeForGrounding(extracted.value);

  if (
    !normalizedExcerpt ||
    !normalizedCv.includes(normalizedExcerpt) ||
    (requireValueInCv && !normalizedCv.includes(normalizedValue))
  ) {
    throw new Error("Ungrounded resume extraction");
  }

  return {
    id: randomUUID(),
    value: extracted.value.trim(),
    verificationStatus: "cv_verified",
    sources: [
      {
        kind: "cv_text",
        scanId,
        section,
        excerpt: extracted.excerpt.trim(),
      },
    ],
  };
}

function normalizeForGrounding(value: string): string {
  return value
    .normalize("NFKC")
    .toLocaleLowerCase("en")
    .replace(/[\u2010-\u2015\u2212]/g, "-")
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201c\u201d]/g, '"')
    .replace(/\s+/g, " ")
    .trim();
}
