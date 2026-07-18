"use client";

import { Download } from "lucide-react";
import { PDFDownloadLink } from "@react-pdf/renderer";

import {
  buildResumePdfData,
  createResumePdfFilename,
} from "@/lib/resume-builder/resume-pdf-data";
import type { ResumeReadyProfile } from "@/lib/resume-builder/resume-profile-utils";
import type { ResumeDraft } from "@/lib/resume-builder/resume-draft-schema";
import type { ResumeLanguage } from "@/lib/resume-builder/resume-language";
import { cn } from "@/lib/utils";

import { ResumeDocument } from "./resume-document";

type ResumePdfDownloadLinkProps = {
  profile: ResumeReadyProfile;
  draft?: ResumeDraft;
  language: ResumeLanguage;
  className?: string;
};

export function ResumePdfDownloadLink({
  profile,
  draft,
  language,
  className,
}: ResumePdfDownloadLinkProps) {
  const fileName = createResumePdfFilename(buildResumePdfData(profile, draft, language).fullName);

  return (
    <PDFDownloadLink
      document={<ResumeDocument profile={profile} draft={draft} language={language} />}
      fileName={fileName}
      className={cn("inline-flex min-h-11 items-center gap-2 rounded-lg bg-[var(--app-forest)] px-4 text-sm font-medium text-white transition-colors hover:bg-[var(--app-forest-2)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--app-forest)]", className)}
    >
      {({ error, loading }) => (
        <>
          <Download className="size-4" aria-hidden="true" />
          {error ? "Download unavailable" : loading ? "Preparing PDF" : "Download PDF"}
        </>
      )}
    </PDFDownloadLink>
  );
}
