import type { ReactNode } from "react";

import { Text, View } from "@react-pdf/renderer";

import { resumePdfStyles as styles } from "./resume-pdf-styles";

type ResumeSectionProps = {
  title: string;
  children: ReactNode;
};

export function ResumeSection({ title, children }: ResumeSectionProps) {
  return (
    <View style={styles.section} minPresenceAhead={30}>
      <Text style={styles.sectionHeading}>{title}</Text>
      <View style={styles.sectionRule} />
      {children}
    </View>
  );
}
