import { Document, Font, Page, Text } from "@react-pdf/renderer";

import { buildResumePdfData } from "@/lib/resume-builder/resume-pdf-data";
import type { ResumeReadyProfile } from "@/lib/resume-builder/resume-profile-utils";
import type { ResumeDraft, ResumeDraftSectionName } from "@/lib/resume-builder/resume-draft-schema";
import { DEFAULT_RESUME_LANGUAGE, type ResumeLanguage } from "@/lib/resume-builder/resume-language";
import { getResumePdfCopy, type ResumePdfCopy } from "@/lib/resume-builder/resume-pdf-copy";

import { ResumeCertifications } from "./resume-certifications";
import { ResumeEducation } from "./resume-education";
import { ResumeExperience } from "./resume-experience";
import { ResumeHeader } from "./resume-header";
import { ResumeLanguages } from "./resume-languages";
import { ResumeProjects } from "./resume-projects";
import { resumePdfStyles as styles } from "./resume-pdf-styles";
import { ResumeSection } from "./resume-section";
import { ResumeSkills } from "./resume-skills";

Font.registerHyphenationCallback((word) => [word]);

export type ResumeDocumentProps = {
  profile: ResumeReadyProfile;
  draft?: ResumeDraft;
  language?: ResumeLanguage;
};

export function ResumeDocument({
  profile,
  draft,
  language = DEFAULT_RESUME_LANGUAGE,
}: ResumeDocumentProps) {
  const data = buildResumePdfData(profile, draft, language);
  const copy = getResumePdfCopy(language);

  return (
    <Document
      author={data.fullName}
      creator="CVMatch"
      language={getDocumentLanguage(data.language)}
      subject={data.professionalTitle ?? copy.documentTitle}
      title={`${data.fullName} ${copy.documentTitle}`}
    >
      <Page size="A4" style={styles.page}>
        <ResumeHeader data={data} />
        {data.sectionOrder
          .filter((section) => !data.hiddenSections.includes(section))
          .map((section) => renderSection(section, data, copy))}
      </Page>
    </Document>
  );
}

function renderSection(
  section: ResumeDraftSectionName,
  data: ReturnType<typeof buildResumePdfData>,
  copy: ResumePdfCopy
) {
  switch (section) {
    case "summary":
      return data.summary ? <ResumeSection key={section} title={copy.summary}><Text style={styles.body} orphans={2} widows={2}>{data.summary}</Text></ResumeSection> : null;
    case "skills": return <ResumeSkills key={section} skills={data.skills} title={copy.skills} />;
    case "experience": return <ResumeExperience key={section} experience={data.experience} title={copy.experience} />;
    case "projects": return <ResumeProjects key={section} projects={data.projects} title={copy.projects} technologiesLabel={copy.technologies} />;
    case "education": return <ResumeEducation key={section} education={data.education} title={copy.education} />;
    case "certifications": return <ResumeCertifications key={section} certifications={data.certifications} title={copy.certifications} credentialLabel={copy.credential} />;
    case "languages": return <ResumeLanguages key={section} languages={data.languages} title={copy.languages} />;
  }
}

function getDocumentLanguage(language: ResumeLanguage): string {
  return language;
}
