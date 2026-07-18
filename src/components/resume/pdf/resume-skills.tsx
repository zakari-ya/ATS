import { Text, View } from "@react-pdf/renderer";

import type { ResumePdfData } from "@/lib/resume-builder/resume-pdf-data";

import { resumePdfStyles as styles } from "./resume-pdf-styles";
import { ResumeSection } from "./resume-section";

export function ResumeSkills({ skills, title }: Pick<ResumePdfData, "skills"> & { title: string }) {
  if (skills.length === 0) return null;

  return (
    <ResumeSection title={title}>
      {skills.map((group) => (
        <View key={group.category} style={styles.skillGroup} wrap={false}>
          <Text style={styles.skillCategory}>{group.category}</Text>
          <Text style={styles.skillItems}>{group.items.join(" · ")}</Text>
        </View>
      ))}
    </ResumeSection>
  );
}
