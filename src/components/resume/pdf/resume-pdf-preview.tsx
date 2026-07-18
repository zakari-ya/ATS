"use client";

import dynamic from "next/dynamic";

import type { ResumeReadyProfile } from "@/lib/resume-builder/resume-profile-utils";
import type { ResumeDraft } from "@/lib/resume-builder/resume-draft-schema";
import type { ResumeLanguage } from "@/lib/resume-builder/resume-language";

const ResumePdfPreviewBrowser = dynamic(
  () =>
    import("./resume-pdf-preview-browser").then(
      (module) => module.ResumePdfPreviewBrowser
    ),
  {
    ssr: false,
    loading: () => <ResumePdfPreviewSkeleton />,
  }
);

type ResumePdfPreviewProps = {
  profile: ResumeReadyProfile;
  draft?: ResumeDraft;
  language: ResumeLanguage;
};

export function ResumePdfPreview({ profile, draft, language }: ResumePdfPreviewProps) {
  return <ResumePdfPreviewBrowser profile={profile} draft={draft} language={language} />;
}

function ResumePdfPreviewSkeleton() {
  return (
    <div
      aria-busy="true"
      aria-label="Loading PDF preview"
      className="flex min-h-[34rem] w-full items-center justify-center rounded-xl border border-[var(--app-border-soft)] bg-white/70 p-6"
    >
      <div className="h-[28rem] w-full max-w-[21rem] animate-pulse rounded-sm bg-[var(--app-surface-soft)]" />
    </div>
  );
}
