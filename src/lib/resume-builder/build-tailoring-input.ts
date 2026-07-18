import type { AiCvMatchResponse } from "@/types/ai";

import type { GroundedString } from "@/lib/resume-builder/resume-profile-schema";
import type { ResumeReadyProfile } from "@/lib/resume-builder/resume-profile-utils";
import type { ResumeLanguage } from "@/lib/resume-builder/resume-language";

export type ResumeTailoringInput = {
  resumeLanguage: ResumeLanguage;
  trustedResumeFacts: Record<string, unknown>;
  jobDescription: string;
  validatedScanAnalysis: Record<string, unknown>;
};

function fact(value: GroundedString | null | undefined) {
  if (!value) return null;
  return { id: value.id, value: value.value };
}

/** Builds the minimised AI payload. Contact values and URLs are deliberately excluded. */
export function buildTailoringInput({
  profile,
  jobDescription,
  aiAnalysis,
  scoreLimitReasons,
  resumeLanguage,
}: {
  profile: ResumeReadyProfile;
  jobDescription: string;
  aiAnalysis: AiCvMatchResponse;
  scoreLimitReasons: string[];
  resumeLanguage: ResumeLanguage;
}): ResumeTailoringInput {
  return {
    resumeLanguage,
    trustedResumeFacts: {
      profileId: profile.id,
      professionalTitle: fact(profile.basics.professionalTitle),
      location: fact(profile.basics.location),
      summary: fact(profile.summary),
      skills: profile.skills.map((group) => ({
        entryId: group.id,
        category: fact(group.category),
        items: group.items.map(fact),
      })),
      experience: profile.experience.map((entry) => ({
        entryId: entry.id,
        role: fact(entry.role),
        company: fact(entry.company),
        location: fact(entry.location),
        dateLabel: fact(entry.dateLabel),
        bullets: (entry.bullets ?? []).map(fact),
      })),
      projects: profile.projects.map((entry) => ({
        entryId: entry.id,
        name: fact(entry.name),
        subtitle: fact(entry.subtitle),
        projectType: fact(entry.projectType),
        dateLabel: fact(entry.dateLabel),
        technologies: (entry.technologies ?? []).map(fact),
        bullets: (entry.bullets ?? []).map(fact),
      })),
      education: profile.education.map((entry) => ({
        entryId: entry.id,
        institution: fact(entry.institution),
        degree: fact(entry.degree),
        fieldOfStudy: fact(entry.fieldOfStudy),
        location: fact(entry.location),
        dateLabel: fact(entry.dateLabel),
      })),
      certifications: profile.certifications.map((entry) => ({
        entryId: entry.id,
        name: fact(entry.name),
        issuer: fact(entry.issuer),
        dateLabel: fact(entry.dateLabel),
        location: fact(entry.location),
      })),
      languages: profile.languages.map((entry) => ({
        entryId: entry.id,
        language: fact(entry.language),
        proficiency: fact(entry.proficiency),
      })),
    },
    jobDescription,
    validatedScanAnalysis: {
      targetRole: aiAnalysis.job_profile.role_title,
      requiredSkills: aiAnalysis.job_profile.required_skills,
      preferredSkills: aiAnalysis.job_profile.preferred_skills,
      responsibilities: aiAnalysis.job_profile.responsibilities,
      experienceRequirements: aiAnalysis.job_profile.experience_requirements,
      matchMatrix: aiAnalysis.match_matrix.map((item) => ({
        requirement: item.requirement,
        priority: item.priority,
        matchStatus: item.match_status,
        reason: item.reason,
      })),
      improvementPriorities: aiAnalysis.feedback_inputs.recommended_cv_improvements,
      scoreLimitReasons,
    },
  };
}
