import { Link, Text, View } from "@react-pdf/renderer";

import type { ResumePdfData } from "@/lib/resume-builder/resume-pdf-data";

import { resumePdfStyles as styles } from "./resume-pdf-styles";
import { ResumeSection } from "./resume-section";

export function ResumeProjects({ projects, title, technologiesLabel }: Pick<ResumePdfData, "projects"> & { title: string; technologiesLabel: string }) {
  if (projects.length === 0) return null;

  return (
    <ResumeSection title={title}>
      {projects.map((project) => (
        <View key={project.id} style={styles.entry} minPresenceAhead={28}>
          <View style={styles.entryTopLine}>
            <View style={styles.entryPrimary}>
              <Text style={styles.entryTitle}>{project.name}</Text>
              {project.subtitle ? <Text style={styles.entryMeta}>{project.subtitle}</Text> : null}
              {project.projectType ? <Text style={styles.entryMeta}>{project.projectType}</Text> : null}
            </View>
            {project.dateLabel ? (
              <View style={styles.entrySecondary}>
                <Text style={styles.entryDate}>{project.dateLabel}</Text>
              </View>
            ) : null}
          </View>
          {project.links.length > 0 ? (
            <View style={styles.projectLinks}>
              {project.links.map((link) => (
                <Link key={link.href} src={link.href} style={styles.link}>
                  {link.label}
                </Link>
              ))}
            </View>
          ) : null}
          {project.technologies.length > 0 ? (
            <Text style={styles.technologies}>
              {technologiesLabel}: {project.technologies.join(" · ")}
            </Text>
          ) : null}
          {project.bullets.map((bullet, index) => (
            <View key={`${project.id}-bullet-${index}`} style={styles.bulletRow}>
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
