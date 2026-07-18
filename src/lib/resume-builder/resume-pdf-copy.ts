import type { ResumeLanguage } from "@/lib/resume-builder/resume-language";

export type ResumePdfCopy = {
  documentTitle: string;
  summary: string;
  skills: string;
  experience: string;
  projects: string;
  education: string;
  certifications: string;
  languages: string;
  technologies: string;
  repository: string;
  liveProject: string;
  credential: string;
};

const COPY: Record<ResumeLanguage, ResumePdfCopy> = {
  en: {
    documentTitle: "Resume",
    summary: "Professional Summary",
    skills: "Skills",
    experience: "Experience",
    projects: "Projects",
    education: "Education",
    certifications: "Certifications",
    languages: "Languages",
    technologies: "Technologies",
    repository: "Repository",
    liveProject: "Live project",
    credential: "Credential",
  },
  fr: {
    documentTitle: "CV",
    summary: "Profil professionnel",
    skills: "Compétences",
    experience: "Expérience professionnelle",
    projects: "Projets",
    education: "Formation",
    certifications: "Certifications",
    languages: "Langues",
    technologies: "Technologies",
    repository: "Dépôt",
    liveProject: "Projet en ligne",
    credential: "Attestation",
  },
};

export function getResumePdfCopy(language: ResumeLanguage): ResumePdfCopy {
  return COPY[language];
}
