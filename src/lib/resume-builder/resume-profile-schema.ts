import { z } from "zod";

import { isSafeHttpUrl } from "@/lib/security/safe-url";

export const RESUME_PROFILE_SCHEMA_VERSION = 1 as const;

export const RESUME_VERIFICATION_STATUSES = [
  "candidate",
  "cv_verified",
  "confirmed",
  "user_provided",
] as const;

export const RESUME_SOURCE_KINDS = ["cv_text", "user_input"] as const;

export const resumeVerificationStatusSchema = z.enum(
  RESUME_VERIFICATION_STATUSES
);
export const resumeSourceKindSchema = z.enum(RESUME_SOURCE_KINDS);

const uuidSchema = z.string().uuid();
const shortTextSchema = z.string().trim().min(1).max(180);
const mediumTextSchema = z.string().trim().min(1).max(600);
const excerptSchema = z.string().trim().min(1).max(700);
const safeUrlSchema = z
  .string()
  .trim()
  .min(1)
  .max(2048)
  .url()
  .refine(isSafeHttpUrl, { message: "URLs must use http or https." });

export const resumeFactSourceSchema = z
  .object({
    kind: resumeSourceKindSchema,
    scanId: uuidSchema.optional(),
    section: shortTextSchema.optional(),
    excerpt: excerptSchema.optional(),
  })
  .strict();

export const groundedStringSchema = z
  .object({
    id: uuidSchema,
    value: mediumTextSchema,
    verificationStatus: resumeVerificationStatusSchema,
    sources: z.array(resumeFactSourceSchema).min(1).max(8),
  })
  .strict()
  .superRefine((fact, context) => {
    const sourceKinds = new Set(fact.sources.map((source) => source.kind));

    if (
      (fact.verificationStatus === "candidate" ||
        fact.verificationStatus === "cv_verified" ||
        fact.verificationStatus === "confirmed") &&
      !sourceKinds.has("cv_text")
    ) {
      context.addIssue({
        code: "custom",
        path: ["sources"],
        message: "CV-derived facts must include cv_text provenance.",
      });
    }

    if (
      fact.verificationStatus === "user_provided" &&
      !sourceKinds.has("user_input")
    ) {
      context.addIssue({
        code: "custom",
        path: ["sources"],
        message: "User-provided facts must include user_input provenance.",
      });
    }
  });

export const groundedUrlSchema = groundedStringSchema.safeExtend({
  value: safeUrlSchema,
});

export const groundedEmailSchema = groundedStringSchema.safeExtend({
  value: z.string().trim().email().max(254),
});

const optionalGroundedStringSchema = groundedStringSchema.nullable();
const optionalGroundedUrlSchema = groundedUrlSchema.nullable();

const skillGroupSchema = z
  .object({
    id: uuidSchema,
    category: groundedStringSchema,
    items: z.array(groundedStringSchema).min(1).max(40),
  })
  .strict();

const experienceEntrySchema = z
  .object({
    id: uuidSchema,
    role: optionalGroundedStringSchema,
    company: optionalGroundedStringSchema,
    location: optionalGroundedStringSchema,
    dateLabel: optionalGroundedStringSchema,
    bullets: z.array(groundedStringSchema).max(30).optional(),
  })
  .strict();

const projectEntrySchema = z
  .object({
    id: uuidSchema,
    name: groundedStringSchema,
    subtitle: optionalGroundedStringSchema,
    projectType: optionalGroundedStringSchema,
    dateLabel: optionalGroundedStringSchema,
    repositoryUrl: optionalGroundedUrlSchema,
    liveUrl: optionalGroundedUrlSchema,
    technologies: z.array(groundedStringSchema).max(40).optional(),
    bullets: z.array(groundedStringSchema).max(30).optional(),
  })
  .strict();

const educationEntrySchema = z
  .object({
    id: uuidSchema,
    institution: optionalGroundedStringSchema,
    degree: optionalGroundedStringSchema,
    fieldOfStudy: optionalGroundedStringSchema,
    location: optionalGroundedStringSchema,
    dateLabel: optionalGroundedStringSchema,
  })
  .strict();

const certificationEntrySchema = z
  .object({
    id: uuidSchema,
    name: groundedStringSchema,
    issuer: optionalGroundedStringSchema,
    dateLabel: optionalGroundedStringSchema,
    location: optionalGroundedStringSchema,
    credentialUrl: optionalGroundedUrlSchema,
  })
  .strict();

const languageEntrySchema = z
  .object({
    id: uuidSchema,
    language: groundedStringSchema,
    proficiency: optionalGroundedStringSchema,
  })
  .strict();

export const resumeProfileSchema = z
  .object({
    id: uuidSchema,
    sourceScanId: uuidSchema,
    schemaVersion: z.literal(RESUME_PROFILE_SCHEMA_VERSION),
    basics: z
      .object({
        fullName: optionalGroundedStringSchema,
        professionalTitle: optionalGroundedStringSchema,
        email: groundedEmailSchema.nullable(),
        phone: optionalGroundedStringSchema,
        location: optionalGroundedStringSchema,
        linkedin: optionalGroundedUrlSchema,
        github: optionalGroundedUrlSchema,
        portfolio: optionalGroundedUrlSchema,
      })
      .strict(),
    summary: optionalGroundedStringSchema,
    skills: z.array(skillGroupSchema).max(30),
    experience: z.array(experienceEntrySchema).max(30),
    projects: z.array(projectEntrySchema).max(30),
    education: z.array(educationEntrySchema).max(20),
    certifications: z.array(certificationEntrySchema).max(30),
    languages: z.array(languageEntrySchema).max(20),
  })
  .strict();

export type ResumeVerificationStatus = z.infer<
  typeof resumeVerificationStatusSchema
>;
export type ResumeSourceKind = z.infer<typeof resumeSourceKindSchema>;
export type ResumeFactSource = z.infer<typeof resumeFactSourceSchema>;
export type GroundedString = z.infer<typeof groundedStringSchema>;
export type GroundedUrl = z.infer<typeof groundedUrlSchema>;
export type ResumeProfile = z.infer<typeof resumeProfileSchema>;
