import { readFile } from "node:fs/promises";
import path from "node:path";

import { renderToBuffer } from "@react-pdf/renderer";
import { createElement } from "react";
import { describe, expect, it } from "vitest";

import { ResumeDocument } from "@/components/resume/pdf/resume-document";
import {
  fictionalResumeProfileFixture,
  fictionalResumeReadyProfileFixture,
} from "@/lib/resume-builder/resume-profile-fixture";
import {
  buildResumePdfData,
  createResumePdfFilename,
} from "@/lib/resume-builder/resume-pdf-data";
import { resumeDraftSchema } from "@/lib/resume-builder/resume-draft-schema";
import { createResumeReadyProfile } from "@/lib/resume-builder/resume-profile-utils";

describe("resume PDF data mapping", () => {
  it("maps the trusted fixture into all supported resume sections", () => {
    const data = buildResumePdfData(fictionalResumeReadyProfileFixture);

    expect(data.fullName).toBe("Avery Morgan");
    expect(data.professionalTitle).toBe("Frontend Developer");
    expect(data.skills).toContainEqual({
      category: "Frontend",
      items: ["React", "TypeScript", "Next.js"],
    });
    expect(data.experience[0]?.company).toBe("Northwind Studio");
    expect(data.projects[0]?.links).toContainEqual({
      label: "Repository",
      href: "https://github.com/avery-morgan/volunteer-connect",
    });
    expect(data.education[0]?.institution).toBe("City Institute of Technology");
    expect(data.certifications[0]?.credentialUrl).toBe(
      "https://credentials.example.test/avery-accessibility"
    );
    expect(data.languages[0]?.language).toBe("English");
  });

  it("hides empty optional sections in mapped data", () => {
    const ready = createResumeReadyProfile({
      ...fictionalResumeProfileFixture,
      experience: [],
      projects: [],
      education: [],
      certifications: [],
      languages: [],
    });

    expect(ready.ok).toBe(true);
    if (!ready.ok) return;

    const data = buildResumePdfData(ready.data);
    expect(data.experience).toHaveLength(0);
    expect(data.projects).toHaveLength(0);
    expect(data.education).toHaveLength(0);
    expect(data.certifications).toHaveLength(0);
    expect(data.languages).toHaveLength(0);
  });

  it("supports absent optional contact fields", () => {
    const ready = createResumeReadyProfile({
      ...fictionalResumeProfileFixture,
      basics: {
        ...fictionalResumeProfileFixture.basics,
        phone: null,
        location: null,
        linkedin: null,
        github: null,
        portfolio: null,
      },
    });

    expect(ready.ok).toBe(true);
    if (!ready.ok) return;

    expect(buildResumePdfData(ready.data).contactItems).toEqual([
      {
        label: "avery.morgan@example.test",
        href: "mailto:avery.morgan@example.test",
      },
    ]);
  });

  it("upgrades legacy CV-grounded candidates and rejects unsafe data before PDF rendering", () => {
    const candidateProfile = {
      ...fictionalResumeProfileFixture,
      summary: {
        ...fictionalResumeProfileFixture.summary!,
        verificationStatus: "candidate" as const,
        sources: [
          {
            kind: "cv_text" as const,
            scanId: fictionalResumeProfileFixture.sourceScanId,
            excerpt: "Fictional candidate summary",
          },
        ],
      },
    };
    const unsafeUrlProfile = {
      ...fictionalResumeProfileFixture,
      basics: {
        ...fictionalResumeProfileFixture.basics,
        portfolio: {
          ...fictionalResumeProfileFixture.basics.fullName!,
          value: "javascript:alert(1)",
        },
      },
    };

    expect(createResumeReadyProfile(candidateProfile).ok).toBe(true);
    expect(createResumeReadyProfile(unsafeUrlProfile).ok).toBe(false);
  });

  it("creates safe, stable download filenames", () => {
    expect(createResumePdfFilename("Avery Morgan")).toBe("avery-morgan-resume.pdf");
    expect(createResumePdfFilename("Avery / Morgan <> ?")).toBe(
      "avery-morgan-resume.pdf"
    );
    expect(createResumePdfFilename("   ")).toBe("cvmatch-resume.pdf");
  });

  it("keeps all verified profile sections while applying grounded draft wording", () => {
    const draft = resumeDraftSchema.parse({
      schemaVersion: 1,
      summarySentences: [
        {
          id: "10000000-0000-4000-8000-000000000060",
          text: "Builds accessible React interfaces for product teams.",
          sourceFactIds: ["10000000-0000-4000-8000-000000000009"],
        },
      ],
      selectedSkillIds: ["10000000-0000-4000-8000-000000000012"],
      experience: [
        {
          entryId: "10000000-0000-4000-8000-000000000020",
          bullets: [
            {
              id: "10000000-0000-4000-8000-000000000061",
              text: "Built accessible React interfaces for customer workflows.",
              sourceFactIds: ["10000000-0000-4000-8000-000000000025"],
            },
          ],
        },
      ],
      projects: [],
      selectedEducationEntryIds: [],
      selectedCertificationEntryIds: [],
      selectedLanguageEntryIds: [],
      sectionOrder: ["summary", "skills", "experience"],
      hiddenSections: ["experience"],
      userEditedContentIds: ["10000000-0000-4000-8000-000000000061"],
      warnings: [],
    });

    const data = buildResumePdfData(fictionalResumeReadyProfileFixture, draft);

    expect(data.summary).toBe("Builds accessible React interfaces for product teams.");
    expect(data.skills).toContainEqual({
      category: "Frontend",
      items: ["React", "TypeScript", "Next.js"],
    });
    expect(data.projects).toHaveLength(1);
    expect(data.hiddenSections).toEqual(["experience"]);
    expect(data.sectionOrder).toEqual(["summary", "skills", "experience"]);
  });

  it("renders a valid PDF buffer for normal and long fictional content", async () => {
    const normalBuffer = await renderToBuffer(
      createElement(ResumeDocument, {
        profile: fictionalResumeReadyProfileFixture,
      }) as never
    );

    const longFixture = createResumeReadyProfile({
      ...fictionalResumeProfileFixture,
      experience: fictionalResumeProfileFixture.experience.map((entry) => ({
        ...entry,
        bullets: Array.from({ length: 18 }, (_, index) => ({
          ...entry.bullets![0]!,
          id: `10000000-0000-4000-8000-${String(900 + index).padStart(12, "0")}`,
          value: `Fictional long-form evidence item ${index + 1} describing a project contribution with enough detail to wrap naturally across the page.`,
        })),
      })),
    });

    expect(longFixture.ok).toBe(true);
    if (!longFixture.ok) return;

    const longBuffer = await renderToBuffer(
      createElement(ResumeDocument, { profile: longFixture.data }) as never
    );

    expect(normalBuffer.length).toBeGreaterThan(100);
    expect(normalBuffer.subarray(0, 4).toString()).toBe("%PDF");
    expect(longBuffer.length).toBeGreaterThan(100);
    expect(longBuffer.subarray(0, 4).toString()).toBe("%PDF");
  });

  it("keeps PDF components free of database and AI imports", async () => {
    const pdfDirectory = path.join(process.cwd(), "src/components/resume/pdf");
    const documentSource = await readFile(
      path.join(pdfDirectory, "resume-document.tsx"),
      "utf8"
    );
    const previewSource = await readFile(
      path.join(pdfDirectory, "resume-pdf-preview.tsx"),
      "utf8"
    );

    expect(`${documentSource}\n${previewSource}`).not.toMatch(
      /lib\/(supabase|ai)|from ["']@\/features\/scan/
    );
  });
});
