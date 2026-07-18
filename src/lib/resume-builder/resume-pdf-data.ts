import type { ResumeReadyProfile } from "@/lib/resume-builder/resume-profile-utils";
import type { ResumeDraft, ResumeDraftSectionName } from "@/lib/resume-builder/resume-draft-schema";
import { DEFAULT_RESUME_LANGUAGE, type ResumeLanguage } from "@/lib/resume-builder/resume-language";
import { getResumePdfCopy } from "@/lib/resume-builder/resume-pdf-copy";

export type ResumePdfLink = {
  label: string;
  href: string;
};

export type ResumePdfData = {
  fullName: string;
  professionalTitle?: string;
  contactItems: Array<{ label: string; href?: string }>;
  summary?: string;
  skills: Array<{ category: string; items: string[] }>;
  experience: Array<{
    id: string;
    role?: string;
    company?: string;
    location?: string;
    dateLabel?: string;
    bullets: string[];
  }>;
  projects: Array<{
    id: string;
    name: string;
    subtitle?: string;
    projectType?: string;
    dateLabel?: string;
    links: ResumePdfLink[];
    technologies: string[];
    bullets: string[];
  }>;
  education: Array<{
    id: string;
    institution?: string;
    degree?: string;
    fieldOfStudy?: string;
    location?: string;
    dateLabel?: string;
  }>;
  certifications: Array<{
    id: string;
    name: string;
    issuer?: string;
    location?: string;
    dateLabel?: string;
    credentialUrl?: string;
  }>;
  languages: Array<{ id: string; language: string; proficiency?: string }>;
  language: ResumeLanguage;
  sectionOrder: ResumeDraftSectionName[];
  hiddenSections: ResumeDraftSectionName[];
};

export function buildResumePdfData(
  profile: ResumeReadyProfile,
  draft?: ResumeDraft,
  language: ResumeLanguage = DEFAULT_RESUME_LANGUAGE
): ResumePdfData {
  const copy = getResumePdfCopy(language);
  const contactItems = [
    profile.basics.email && {
      label: profile.basics.email.value,
      href: `mailto:${profile.basics.email.value}`,
    },
    profile.basics.phone && { label: profile.basics.phone.value },
    profile.basics.location && { label: profile.basics.location.value },
    profile.basics.linkedin && {
      label: "LinkedIn",
      href: profile.basics.linkedin.value,
    },
    profile.basics.github && { label: "GitHub", href: profile.basics.github.value },
    profile.basics.portfolio && {
      label: "Portfolio",
      href: profile.basics.portfolio.value,
    },
  ].filter((item): item is { label: string; href?: string } => Boolean(item));

  return {
    fullName: profile.basics.fullName!.value,
    professionalTitle: profile.basics.professionalTitle?.value,
    contactItems,
    summary: draft?.summarySentences.map((sentence) => sentence.text).join(" ") || profile.summary?.value,
    skills: profile.skills.map((group) => ({
      category: group.category.value,
      items: group.items.map((item) => item.value),
    })).filter((group) => group.items.length > 0),
    experience: profile.experience.map((entry) => ({
      id: entry.id,
      role: entry.role?.value,
      company: entry.company?.value,
      location: entry.location?.value,
      dateLabel: entry.dateLabel?.value,
      bullets: draft?.experience.find((item) => item.entryId === entry.id)?.bullets.map((bullet) => bullet.text) ?? entry.bullets?.map((bullet) => bullet.value) ?? [],
    })),
    projects: profile.projects.map((entry) => ({
      id: entry.id,
      name: entry.name.value,
      subtitle: entry.subtitle?.value,
      projectType: entry.projectType?.value,
      dateLabel: entry.dateLabel?.value,
      links: [
        entry.repositoryUrl && {
          label: copy.repository,
          href: entry.repositoryUrl.value,
        },
        entry.liveUrl && { label: copy.liveProject, href: entry.liveUrl.value },
      ].filter((link): link is ResumePdfLink => Boolean(link)),
      technologies: entry.technologies?.map((technology) => technology.value) ?? [],
      bullets: draft?.projects.find((item) => item.entryId === entry.id)?.bullets.map((bullet) => bullet.text) ?? entry.bullets?.map((bullet) => bullet.value) ?? [],
    })),
    education: profile.education.map((entry) => ({
      id: entry.id,
      institution: entry.institution?.value,
      degree: entry.degree?.value,
      fieldOfStudy: entry.fieldOfStudy?.value,
      location: entry.location?.value,
      dateLabel: entry.dateLabel?.value,
    })),
    certifications: profile.certifications.map((entry) => ({
      id: entry.id,
      name: entry.name.value,
      issuer: entry.issuer?.value,
      location: entry.location?.value,
      dateLabel: entry.dateLabel?.value,
      credentialUrl: entry.credentialUrl?.value,
    })),
    languages: profile.languages.map((entry) => ({
      id: entry.id,
      language: entry.language.value,
      proficiency: entry.proficiency?.value,
    })),
    language,
    sectionOrder: draft?.sectionOrder ?? ["summary", "skills", "experience", "projects", "education", "certifications", "languages"],
    hiddenSections: draft?.hiddenSections ?? [],
  };
}

export function createResumePdfFilename(fullName: string): string {
  const normalized = fullName
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return normalized ? `${normalized}-resume.pdf` : "cvmatch-resume.pdf";
}
