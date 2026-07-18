import { StyleSheet } from "@react-pdf/renderer";

export const resumePdfStyles = StyleSheet.create({
  page: {
    backgroundColor: "#ffffff",
    color: "#161616",
    fontFamily: "Helvetica",
    fontSize: 8.4,
    lineHeight: 1.25,
    paddingTop: 24,
    paddingRight: 28,
    paddingBottom: 24,
    paddingLeft: 28,
  },
  header: {
    alignItems: "center",
    marginBottom: 9,
  },
  name: {
    fontFamily: "Times-Roman",
    fontSize: 21,
    lineHeight: 1.1,
    textAlign: "center",
  },
  title: {
    color: "#313131",
    fontSize: 9.5,
    marginTop: 2,
    textAlign: "center",
  },
  contactLine: {
    alignItems: "center",
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    marginTop: 4,
  },
  contactItem: {
    color: "#313131",
    fontSize: 7.8,
    marginHorizontal: 2,
  },
  contactSeparator: {
    color: "#777777",
    fontSize: 7.8,
  },
  section: {
    marginTop: 6,
  },
  sectionHeading: {
    fontFamily: "Helvetica-Bold",
    fontSize: 9.6,
    letterSpacing: 0.45,
    textTransform: "uppercase",
  },
  sectionRule: {
    backgroundColor: "#242424",
    height: 0.65,
    marginBottom: 3,
    marginTop: 2,
    width: "100%",
  },
  body: {
    fontSize: 8.4,
    lineHeight: 1.28,
  },
  entry: {
    marginBottom: 4,
  },
  entryTopLine: {
    alignItems: "flex-start",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  entryPrimary: {
    flexGrow: 1,
    flexShrink: 1,
    paddingRight: 10,
  },
  entrySecondary: {
    alignItems: "flex-end",
    flexShrink: 0,
    maxWidth: "36%",
  },
  entryTitle: {
    fontFamily: "Helvetica-Bold",
    fontSize: 8.9,
    lineHeight: 1.25,
  },
  entryMeta: {
    color: "#353535",
    fontSize: 8,
    lineHeight: 1.28,
  },
  entryDate: {
    fontSize: 7.9,
    textAlign: "right",
  },
  bulletRow: {
    flexDirection: "row",
    marginTop: 1.5,
    paddingLeft: 2,
  },
  bulletMarker: {
    fontSize: 8.4,
    paddingRight: 4,
    width: 10,
  },
  bulletText: {
    flex: 1,
    fontSize: 8.2,
    lineHeight: 1.25,
  },
  skillGroup: {
    flexDirection: "row",
    marginBottom: 2,
  },
  skillCategory: {
    fontFamily: "Helvetica-Bold",
    fontSize: 8.3,
    width: 88,
  },
  skillItems: {
    flex: 1,
    fontSize: 8.3,
  },
  inlineText: {
    fontSize: 8.1,
  },
  link: {
    color: "#161616",
    fontSize: 8,
    textDecoration: "underline",
  },
  projectLinks: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 5,
    marginTop: 1,
  },
  technologies: {
    color: "#353535",
    fontSize: 8,
    marginTop: 1,
  },
  languageLine: {
    fontSize: 8.2,
    marginBottom: 2,
  },
});
