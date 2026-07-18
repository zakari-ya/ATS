import { describe, expect, it } from "vitest";

import { fictionalResumeProfileFixture } from "@/lib/resume-builder/resume-profile-fixture";
import {
  collectCandidateFactsForReview,
  confirmCandidateFacts,
} from "@/lib/resume-builder/resume-profile-review";

describe("resume profile batch review", () => {
  it("groups candidate facts and identifies long summary content", () => {
    const profile = structuredClone(fictionalResumeProfileFixture);
    const summary = profile.summary!;
    summary.verificationStatus = "candidate";
    summary.sources = [
      {
        kind: "cv_text",
        scanId: profile.sourceScanId,
        section: "summary",
        excerpt: summary.value,
      },
    ];

    expect(collectCandidateFactsForReview(profile)).toContainEqual(
      expect.objectContaining({
        id: summary.id,
        section: "summary",
        isLongText: true,
      })
    );
  });

  it("confirms selected candidates in one validated update", () => {
    const profile = structuredClone(fictionalResumeProfileFixture);
    const fullName = profile.basics.fullName!;
    const title = profile.basics.professionalTitle!;
    for (const fact of [fullName, title]) {
      fact.verificationStatus = "candidate";
      fact.sources = [
        {
          kind: "cv_text",
          scanId: profile.sourceScanId,
          section: "basics",
          excerpt: fact.value,
        },
      ];
    }

    const confirmed = confirmCandidateFacts(profile, [fullName.id, title.id]);

    expect(confirmed?.basics.fullName?.verificationStatus).toBe("confirmed");
    expect(confirmed?.basics.professionalTitle?.verificationStatus).toBe(
      "confirmed"
    );
  });

  it("rejects unknown, duplicate, and already trusted IDs", () => {
    const profile = structuredClone(fictionalResumeProfileFixture);
    const trustedId = profile.basics.fullName!.id;

    expect(confirmCandidateFacts(profile, [crypto.randomUUID()])).toBeNull();
    expect(confirmCandidateFacts(profile, [trustedId])).toBeNull();
    expect(confirmCandidateFacts(profile, [trustedId, trustedId])).toBeNull();
  });
});
