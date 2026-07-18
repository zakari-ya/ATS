import { Text, View } from "@react-pdf/renderer";

import type { ResumePdfData } from "@/lib/resume-builder/resume-pdf-data";

import { resumePdfStyles as styles } from "./resume-pdf-styles";
import { ResumeSection } from "./resume-section";

export function ResumeExperience({
  experience,
  title,
}: Pick<ResumePdfData, "experience"> & { title: string }) {
  if (experience.length === 0) return null;

  return (
    <ResumeSection title={title}>
      {experience.map((entry) => (
        <View key={entry.id} style={styles.entry} minPresenceAhead={28}>
          <View style={styles.entryTopLine}>
            <View style={styles.entryPrimary}>
              {entry.role ? <Text style={styles.entryTitle}>{entry.role}</Text> : null}
              {entry.company ? <Text style={styles.entryMeta}>{entry.company}</Text> : null}
            </View>
            <View style={styles.entrySecondary}>
              {entry.dateLabel ? <Text style={styles.entryDate}>{entry.dateLabel}</Text> : null}
              {entry.location ? <Text style={styles.entryMeta}>{entry.location}</Text> : null}
            </View>
          </View>
          {entry.bullets.map((bullet, index) => (
            <View key={`${entry.id}-bullet-${index}`} style={styles.bulletRow}>
              <Text style={styles.bulletMarker}>•</Text>
              <Text style={styles.bulletText} orphans={2} widows={2}>
                {bullet}
              </Text>
            </View>
          ))}
        </View>
      ))}
    </ResumeSection>
  );
}
