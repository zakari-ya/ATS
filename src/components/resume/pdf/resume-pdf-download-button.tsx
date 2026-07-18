"use client";

import dynamic from "next/dynamic";

import type { ResumeReadyProfile } from "@/lib/resume-builder/resume-profile-utils";
import type { ResumeDraft } from "@/lib/resume-builder/resume-draft-schema";
import type { ResumeLanguage } from "@/lib/resume-builder/resume-language";

const ResumePdfDownloadLink = dynamic(
  () =>
    import("./resume-pdf-download-link").then(
      (module) => module.ResumePdfDownloadLink
    ),
  {
    ssr: false,
    loading: () => (
      <span className="inline-flex min-h-11 items-center rounded-lg bg-[var(--app-forest)] px-4 text-sm font-medium text-white/70">
        Preparing download
      </span>
    ),
  }
);

type ResumePdfDownloadButtonProps = {
  profile: ResumeReadyProfile;
  draft?: ResumeDraft;
  language: ResumeLanguage;
  className?: string;
};

export function ResumePdfDownloadButton({
  profile,
  draft,
  language,
  className,
}: ResumePdfDownloadButtonProps) {
  return <ResumePdfDownloadLink profile={profile} draft={draft} language={language} className={className} />;
}
