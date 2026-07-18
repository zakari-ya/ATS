import { Link, Text, View } from "@react-pdf/renderer";

import type { ResumePdfData } from "@/lib/resume-builder/resume-pdf-data";

import { resumePdfStyles as styles } from "./resume-pdf-styles";
import { ResumeSection } from "./resume-section";

export function ResumeCertifications({
  certifications,
  title,
  credentialLabel,
}: Pick<ResumePdfData, "certifications"> & { title: string; credentialLabel: string }) {
  if (certifications.length === 0) return null;

  return (
    <ResumeSection title={title}>
      {certifications.map((entry) => (
        <View key={entry.id} style={styles.entry} wrap={false}>
          <View style={styles.entryTopLine}>
            <View style={styles.entryPrimary}>
              <Text style={styles.entryTitle}>{entry.name}</Text>
              {entry.issuer ? <Text style={styles.entryMeta}>{entry.issuer}</Text> : null}
              {entry.credentialUrl ? (
                <Link src={entry.credentialUrl} style={styles.link}>
                  {credentialLabel}
                </Link>
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
