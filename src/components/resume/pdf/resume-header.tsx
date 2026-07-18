import { Link, Text, View } from "@react-pdf/renderer";

import type { ResumePdfData } from "@/lib/resume-builder/resume-pdf-data";

import { resumePdfStyles as styles } from "./resume-pdf-styles";

type ResumeHeaderProps = {
  data: Pick<ResumePdfData, "fullName" | "professionalTitle" | "contactItems">;
};

export function ResumeHeader({ data }: ResumeHeaderProps) {
  return (
    <View style={styles.header}>
      <Text style={styles.name}>{data.fullName}</Text>
      {data.professionalTitle ? (
        <Text style={styles.title}>{data.professionalTitle}</Text>
      ) : null}
      {data.contactItems.length > 0 ? (
        <View style={styles.contactLine}>
          {data.contactItems.map((item, index) => (
            <View key={`${item.label}-${index}`} style={styles.contactLine}>
              {index > 0 ? <Text style={styles.contactSeparator}>|</Text> : null}
              {item.href ? (
                <Link src={item.href} style={styles.contactItem}>
                  {item.label}
                </Link>
              ) : (
                <Text style={styles.contactItem}>{item.label}</Text>
              )}
            </View>
          ))}
        </View>
      ) : null}
    </View>
  );
}
