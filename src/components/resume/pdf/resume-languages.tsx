import { Text } from "@react-pdf/renderer";

import type { ResumePdfData } from "@/lib/resume-builder/resume-pdf-data";

import { resumePdfStyles as styles } from "./resume-pdf-styles";
import { ResumeSection } from "./resume-section";

export function ResumeLanguages({ languages, title }: Pick<ResumePdfData, "languages"> & { title: string }) {
  if (languages.length === 0) return null;

  return (
    <ResumeSection title={title}>
      {languages.map((entry) => (
        <Text key={entry.id} style={styles.languageLine}>
          {entry.language}
          {entry.proficiency ? ` - ${entry.proficiency}` : ""}
        </Text>
      ))}
    </ResumeSection>
  );
}
