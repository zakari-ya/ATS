import {
  resumeProfileSchema,
  type GroundedString,
  type ResumeProfile,
} from "@/lib/resume-builder/resume-profile-schema";

export const RESUME_REVIEW_SECTION_ORDER = [
  "personal",
  "summary",
  "skills",
  "experience",
  "projects",
  "education",
  "certifications",
  "languages",
] as const;

export type ResumeReviewSection =
  (typeof RESUME_REVIEW_SECTION_ORDER)[number];

export type ResumeCandidateFact = {
  id: string;
  label: string;
  value: string;
  section: ResumeReviewSection;
  isLongText: boolean;
};

export const RESUME_REVIEW_SECTION_LABELS: Record<
  ResumeReviewSection,
  string
> = {
  personal: "Personal information",
  summary: "Professional summary",
  skills: "Skills",
  experience: "Experience",
  projects: "Projects",
  education: "Education",
  certifications: "Certifications",
  languages: "Languages",
};

export function collectCandidateFactsForReview(
  profile: ResumeProfile
): ResumeCandidateFact[] {
  const facts: ResumeCandidateFact[] = [];

  const walk = (value: unknown, path: string): void => {
    if (Array.isArray(value)) {
      value.forEach((item, index) => walk(item, `${path}.${index + 1}`));
      return;
    }
    if (!value || typeof value !== "object") return;

    if (isGroundedFact(value) && value.verificationStatus === "candidate") {
      facts.push(describeCandidateFact(value, path));
      return;
    }

    Object.entries(value).forEach(([key, nested]) =>
      walk(nested, path ? `${path}.${key}` : key)
    );
  };

  walk(profile, "");
  return facts;
}

export function confirmCandidateFacts(
  profile: ResumeProfile,
  factIds: string[]
): ResumeProfile | null {
  const selectedIds = new Set(factIds);
  if (!selectedIds.size || selectedIds.size !== factIds.length) return null;

  let confirmedCount = 0;
  const apply = (value: unknown): unknown => {
    if (Array.isArray(value)) return value.map(apply);
    if (!value || typeof value !== "object") return value;

    if (isGroundedFact(value) && selectedIds.has(value.id)) {
      if (value.verificationStatus !== "candidate") return value;
      confirmedCount += 1;
      return {
        ...value,
        verificationStatus: "confirmed",
        sources: [
          ...value.sources,
          { kind: "user_input", section: "user_confirmation" },
        ],
      };
    }

    return Object.fromEntries(
      Object.entries(value).map(([key, nested]) => [key, apply(nested)])
    );
  };

  const parsed = resumeProfileSchema.safeParse(apply(profile));
  return parsed.success && confirmedCount === selectedIds.size
    ? parsed.data
    : null;
}

function describeCandidateFact(
  fact: GroundedString,
  path: string
): ResumeCandidateFact {
  const parts = path.split(".").filter(Boolean);
  const root = parts[0] ?? "personal";
  const section = toReviewSection(root);
  const entryNumber = parts.find((part) => /^\d+$/.test(part));
  const field = parts.at(-1) ?? "information";
  const fieldLabel = FIELD_LABELS[field] ?? humanize(field);
  const context =
    entryNumber && !["basics", "summary"].includes(root)
      ? `${RESUME_REVIEW_SECTION_LABELS[section]} ${entryNumber}`
      : null;

  return {
    id: fact.id,
    value: fact.value,
    section,
    label: context ? `${context} · ${fieldLabel}` : fieldLabel,
    isLongText:
      root === "summary" || field === "bullets" || field === "bullet",
  };
}

function toReviewSection(root: string): ResumeReviewSection {
  if (root === "basics") return "personal";
  return RESUME_REVIEW_SECTION_ORDER.includes(root as ResumeReviewSection)
    ? (root as ResumeReviewSection)
    : "personal";
}

function isGroundedFact(value: object): value is GroundedString {
  return (
    "id" in value &&
    "value" in value &&
    "verificationStatus" in value &&
    "sources" in value &&
    typeof value.id === "string" &&
    typeof value.value === "string" &&
    Array.isArray(value.sources)
  );
}

function humanize(value: string): string {
  return value
    .replace(/([A-Z])/g, " $1")
    .replace(/s$/, "")
    .replace(/^./, (character) => character.toUpperCase())
    .trim();
}

const FIELD_LABELS: Record<string, string> = {
  fullName: "Full name",
  professionalTitle: "Professional title",
  email: "Email",
  phone: "Phone",
  location: "Location",
  linkedin: "LinkedIn",
  github: "GitHub",
  portfolio: "Portfolio",
  summary: "Professional summary",
  category: "Skill category",
  items: "Skill",
  role: "Role",
  company: "Company",
  dateLabel: "Date",
  bullets: "Evidence",
  name: "Name",
  subtitle: "Subtitle",
  projectType: "Project type",
  repositoryUrl: "Repository",
  liveUrl: "Live project",
  technologies: "Technology",
  institution: "Institution",
  degree: "Degree",
  fieldOfStudy: "Field of study",
  issuer: "Issuer",
  credentialUrl: "Credential",
  language: "Language",
  proficiency: "Proficiency",
};
