import type { GroundedString, ResumeProfile } from "@/lib/resume-builder/resume-profile-schema";
import {
  createResumeReadyProfile,
  type ResumeReadyProfile,
} from "@/lib/resume-builder/resume-profile-utils";

const FIXTURE_SCAN_ID = "10000000-0000-4000-8000-000000000001";

function fixtureId(index: number): string {
  return `10000000-0000-4000-8000-${String(index).padStart(12, "0")}`;
}

function fact(value: string, index: number): GroundedString {
  return {
    id: fixtureId(index),
    value,
    verificationStatus: "user_provided",
    sources: [{ kind: "user_input" }],
  };
}

export const fictionalResumeProfileFixture: ResumeProfile = {
  id: fixtureId(1),
  sourceScanId: FIXTURE_SCAN_ID,
  schemaVersion: 1,
  basics: {
    fullName: fact("Avery Morgan", 2),
    professionalTitle: fact("Frontend Developer", 3),
    email: fact("avery.morgan@example.test", 4),
    phone: fact("+1 555 010 2040", 5),
    location: fact("Remote", 6),
    linkedin: {
      ...fact("https://www.linkedin.com/in/avery-morgan", 7),
      value: "https://www.linkedin.com/in/avery-morgan",
    },
    github: {
      ...fact("https://github.com/avery-morgan", 8),
      value: "https://github.com/avery-morgan",
    },
    portfolio: null,
  },
  summary: fact(
    "Frontend developer focused on accessible interfaces, dependable APIs, and clear product experiences.",
    9
  ),
  skills: [
    {
      id: fixtureId(10),
      category: fact("Frontend", 11),
      items: [fact("React", 12), fact("TypeScript", 13), fact("Next.js", 14)],
    },
    {
      id: fixtureId(15),
      category: fact("Backend", 16),
      items: [fact("Node.js", 17), fact("REST APIs", 18), fact("PostgreSQL", 19)],
    },
  ],
  experience: [
    {
      id: fixtureId(20),
      role: fact("Junior Frontend Developer", 21),
      company: fact("Northwind Studio", 22),
      location: fact("Remote", 23),
      dateLabel: fact("2024 - Present", 24),
      bullets: [
        fact("Built accessible React interfaces for customer-facing workflows.", 25),
        fact("Worked with API teams to improve error handling and loading states.", 26),
      ],
    },
  ],
  projects: [
    {
      id: fixtureId(27),
      name: fact("Volunteer Connect", 28),
      subtitle: fact("Volunteer coordination web application", 29),
      projectType: fact("Personal project", 30),
      dateLabel: fact("2024", 31),
      repositoryUrl: {
        ...fact("https://github.com/avery-morgan/volunteer-connect", 32),
        value: "https://github.com/avery-morgan/volunteer-connect",
      },
      liveUrl: null,
      technologies: [fact("React", 33), fact("TypeScript", 34), fact("PostgreSQL", 35)],
      bullets: [
        fact("Created a responsive workflow for volunteers to find and manage shifts.", 36),
      ],
    },
  ],
  education: [
    {
      id: fixtureId(37),
      institution: fact("City Institute of Technology", 38),
      degree: fact("Bachelor of Science", 39),
      fieldOfStudy: fact("Computer Science", 40),
      location: fact("Remote", 41),
      dateLabel: fact("2021 - 2024", 42),
    },
  ],
  certifications: [
    {
      id: fixtureId(43),
      name: fact("Web Accessibility Foundations", 44),
      issuer: fact("Open Learning Institute", 45),
      dateLabel: fact("2024", 46),
      location: null,
      credentialUrl: {
        ...fact("https://credentials.example.test/avery-accessibility", 47),
        value: "https://credentials.example.test/avery-accessibility",
      },
    },
  ],
  languages: [
    {
      id: fixtureId(48),
      language: fact("English", 49),
      proficiency: fact("Professional working proficiency", 50),
    },
  ],
};

const fixtureResult = createResumeReadyProfile(fictionalResumeProfileFixture);

if (!fixtureResult.ok) {
  throw new Error("The fictional resume profile fixture must be resume-ready.");
}

export const fictionalResumeReadyProfileFixture: ResumeReadyProfile =
  fixtureResult.data;
