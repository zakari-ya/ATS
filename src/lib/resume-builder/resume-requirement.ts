import { z } from "zod";

export const resumeRequirementKindSchema = z.enum([
  "skill",
  "experience",
  "education",
  "certification",
  "language",
]);

export type ResumeRequirementKind = z.infer<
  typeof resumeRequirementKindSchema
>;

export type ResumeRequirement = {
  name: string;
  category: string | null;
  priority: "critical" | "required" | "preferred";
  kind: ResumeRequirementKind;
};

const EXPERIENCE_CATEGORY_PATTERN =
  /\b(experience|seniority|tenure|career|professional background|expérience|ancienneté)\b/i;
const EXPERIENCE_REQUIREMENT_PATTERN =
  /\b(?:\d+|one|two|three|four|five|six|seven|eight|nine|ten)\+?\s*(?:years?|yrs?)\b|\b\d+\+?\s*ans?\b|\byears?\s+of\s+(?:professional\s+)?experience\b|\bans?\s+d['’]expérience\b/i;
const EDUCATION_PATTERN =
  /\b(education|academic|degree|bachelor|master|doctorate|phd|diploma|university|college|formation|diplôme|licence|université|bac\s*\+?\s*\d)\b/i;
const CERTIFICATION_PATTERN =
  /\b(certification|certificate|certified|licen[cs]e|credential|certificat|certifié|certifiée|accréditation)\b/i;
const LANGUAGE_CATEGORY_PATTERN =
  /^(language|languages|langue|langues|language proficiency)$/i;
const LANGUAGE_REQUIREMENT_PATTERN =
  /\b(english|french|spanish|german|arabic|anglais|français|francais|espagnol|allemand|arabe)\b.*\b(fluent|fluency|proficiency|professional|courant|courante|maîtrise|maitrise|niveau)\b|\b(fluent|fluency|proficiency|courant|courante|maîtrise|maitrise)\b.*\b(english|french|spanish|german|arabic|anglais|français|francais|espagnol|allemand|arabe)\b/i;

export function classifyResumeRequirement(input: {
  requirement: string;
  category?: string | null;
}): ResumeRequirementKind {
  const requirement = input.requirement.trim();
  const category = input.category?.trim() ?? "";
  const combined = `${category} ${requirement}`;

  if (
    EXPERIENCE_CATEGORY_PATTERN.test(category) ||
    EXPERIENCE_REQUIREMENT_PATTERN.test(requirement)
  ) {
    return "experience";
  }
  if (EDUCATION_PATTERN.test(combined)) return "education";
  if (CERTIFICATION_PATTERN.test(combined)) return "certification";
  if (
    LANGUAGE_CATEGORY_PATTERN.test(category) ||
    LANGUAGE_REQUIREMENT_PATTERN.test(requirement)
  ) {
    return "language";
  }
  return "skill";
}

export function getRequirementQuestion(kind: ResumeRequirementKind): string {
  switch (kind) {
    case "experience":
      return "Do you meet this experience requirement?";
    case "education":
      return "Do you meet this education requirement?";
    case "certification":
      return "Do you hold this certification?";
    case "language":
      return "Do you meet this language requirement?";
    default:
      return "Have you used this skill before?";
  }
}

export function getRequirementKindLabel(kind: ResumeRequirementKind): string {
  switch (kind) {
    case "experience":
      return "Experience";
    case "education":
      return "Education";
    case "certification":
      return "Certification";
    case "language":
      return "Language";
    default:
      return "Skill";
  }
}
