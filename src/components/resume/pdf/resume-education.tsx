import { Text, View } from "@react-pdf/renderer";

import type { ResumePdfData } from "@/lib/resume-builder/resume-pdf-data";

import { resumePdfStyles as styles } from "./resume-pdf-styles";
import { ResumeSection } from "./resume-section";

export function ResumeEducation({ education, title }: Pick<ResumePdfData, "education"> & { title: string }) {
  if (education.length === 0) return null;

  return (
    <ResumeSection title={title}>
      {education.map((entry) => (
        <View key={entry.id} style={styles.entry} wrap={false}>
          <View style={styles.entryTopLine}>
            <View style={styles.entryPrimary}>
              {entry.institution ? <Text style={styles.entryTitle}>{entry.institution}</Text> : null}
              {[entry.degree, entry.fieldOfStudy].filter(Boolean).join(", ") ? (
                <Text style={styles.entryMeta}>
                  {[entry.degree, entry.fieldOfStudy].filter(Boolean).join(", ")}
                </Text>
              ) : null}
            </View>
            <View style={styles.entrySecondary}>
              {entry.dateLabel ? <Text style={styles.entryDate}>{entry.dateLabel}</Text> : null}
              {entry.location ? <Text style={styles.entryMeta}>{entry.location}</Text> : null}
            </View>
          </View>
        </View>
      ))}
    </ResumeSection>
  );
}
