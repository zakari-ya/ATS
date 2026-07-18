import { z } from "zod";

export const RESUME_LANGUAGES = ["en", "fr"] as const;
export const RESUME_LANGUAGE_SOURCES = ["detected", "user_selected"] as const;

export const resumeLanguageSchema = z.enum(RESUME_LANGUAGES);
export const resumeLanguageSourceSchema = z.enum(RESUME_LANGUAGE_SOURCES);
export const resumeLanguageSettingsSchema = z
  .object({
    language: resumeLanguageSchema,
    source: resumeLanguageSourceSchema,
  })
  .strict();

export type ResumeLanguage = z.infer<typeof resumeLanguageSchema>;
export type ResumeLanguageSource = z.infer<typeof resumeLanguageSourceSchema>;
export type ResumeLanguageSettings = z.infer<
  typeof resumeLanguageSettingsSchema
>;

export const DEFAULT_RESUME_LANGUAGE: ResumeLanguage = "en";

const languageCopy: Record<
  ResumeLanguage,
  { label: string; nativeLabel: string }
> = {
  en: { label: "English", nativeLabel: "English" },
  fr: { label: "French", nativeLabel: "Français" },
};

const FRENCH_MARKERS = [
  "experience",
  "experiences",
  "competence",
  "competences",
  "formation",
  "education",
  "projet",
  "projets",
  "langue",
  "langues",
  "developpeur",
  "developpeuse",
  "ingenieur",
  "ingenieure",
  "professionnel",
  "professionnelle",
  "certification",
  "certifications",
  "responsabilites",
  "stage",
  "janvier",
  "fevrier",
  "mars",
  "avril",
  "mai",
  "juin",
  "juillet",
  "aout",
  "septembre",
  "octobre",
  "novembre",
  "decembre",
];

const ENGLISH_MARKERS = [
  "experience",
  "experiences",
  "skills",
  "education",
  "project",
  "projects",
  "languages",
  "language",
  "developer",
  "engineer",
  "professional",
  "certification",
  "certifications",
  "responsibilities",
  "internship",
  "summary",
  "january",
  "february",
  "march",
  "april",
  "may",
  "june",
  "july",
  "august",
  "september",
  "october",
  "november",
  "december",
];

/**
 * Provides a deterministic suggestion from the already extracted CV text.
 * The user can always override it before a draft is generated.
 */
export function detectResumeLanguage(cvText: string): ResumeLanguage {
  const normalized = cvText
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("en");

  const frenchScore = scoreMarkers(normalized, FRENCH_MARKERS);
  const englishScore = scoreMarkers(normalized, ENGLISH_MARKERS);

  return frenchScore > englishScore ? "fr" : DEFAULT_RESUME_LANGUAGE;
}

export function getResumeLanguageLabel(language: ResumeLanguage): string {
  return languageCopy[language].label;
}

export function getResumeLanguageNativeLabel(language: ResumeLanguage): string {
  return languageCopy[language].nativeLabel;
}

function scoreMarkers(text: string, markers: string[]): number {
  return markers.reduce((score, marker) => {
    const expression = new RegExp(`\\b${marker}\\b`, "g");
    return score + (text.match(expression)?.length ?? 0);
  }, 0);
}
