import { notFound } from "next/navigation";

import { ResumePdfDownloadButton } from "@/components/resume/pdf/resume-pdf-download-button";
import { ResumePdfPreview } from "@/components/resume/pdf/resume-pdf-preview";
import { fictionalResumeReadyProfileFixture } from "@/lib/resume-builder/resume-profile-fixture";

export default function DevelopmentResumePreviewPage() {
  if (process.env.NODE_ENV !== "development") {
    notFound();
  }

  const profile = fictionalResumeReadyProfileFixture;
  const sectionCounts: Array<[string, number]> = [
    ["Skills", profile.skills.length],
    ["Experience", profile.experience.length],
    ["Projects", profile.projects.length],
    ["Education", profile.education.length],
    ["Certifications", profile.certifications.length],
    ["Languages", profile.languages.length],
  ];
  const sectionSummary = sectionCounts.filter(([, count]) => count > 0);

  return (
    <main className="min-h-dvh bg-[var(--app-bg)] px-4 py-6 sm:px-6 lg:px-10">
      <div className="mx-auto w-full max-w-6xl">
        <header className="mb-6 flex flex-col gap-4 border-b border-[var(--app-border-soft)] pb-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.18em] text-[var(--app-muted)]">
              Development only
            </p>
            <h1 className="mt-2 font-[family-name:var(--font-display)] text-4xl text-[var(--app-forest)]">
              Resume template preview
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--app-muted)]">
              Fictional trusted data only. This route is unavailable in production.
            </p>
          </div>
          <ResumePdfDownloadButton profile={profile} language="en" />
        </header>

        <section aria-label="Fixture sections" className="mb-6 flex flex-wrap gap-2">
          {sectionSummary.map(([name, count]) => (
            <span
              key={name}
              className="rounded-full border border-[var(--app-border-soft)] bg-white/80 px-3 py-1.5 text-xs font-medium text-[var(--app-forest)]"
            >
              {name}: {count}
            </span>
          ))}
        </section>

        <ResumePdfPreview profile={profile} language="en" />
      </div>
    </main>
  );
}
