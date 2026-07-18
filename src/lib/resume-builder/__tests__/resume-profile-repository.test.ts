import { beforeEach, describe, expect, it, vi } from "vitest";

const { createClientMock } = vi.hoisted(() => ({
  createClientMock: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: createClientMock,
}));

import { getResumeProfileForScan } from "@/lib/resume-builder/resume-profile-repository";

const SCAN_ID = "00000000-0000-4000-8000-000000000001";

describe("resume profile repository access", () => {
  beforeEach(() => {
    createClientMock.mockReset();
  });

  it("rejects unauthenticated access", async () => {
    createClientMock.mockResolvedValue({
      auth: { getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }) },
    });

    const result = await getResumeProfileForScan(SCAN_ID);
    expect(result).toMatchObject({ ok: false, error: { code: "UNAUTHORIZED" } });
  });

  it("rejects scans that are not owned by the authenticated user", async () => {
    const maybeSingle = vi.fn().mockResolvedValue({ data: null, error: null });
    const eqSecond = vi.fn().mockReturnValue({ maybeSingle });
    const eqFirst = vi.fn().mockReturnValue({ eq: eqSecond });
    const select = vi.fn().mockReturnValue({ eq: eqFirst });
    const from = vi.fn().mockReturnValue({ select });

    createClientMock.mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: "00000000-0000-4000-8000-000000000099" } },
          error: null,
        }),
      },
      from,
    });

    const result = await getResumeProfileForScan(SCAN_ID);
    expect(result).toMatchObject({ ok: false, error: { code: "SCAN_NOT_FOUND" } });
    expect(eqFirst).toHaveBeenCalledWith("id", SCAN_ID);
    expect(eqSecond).toHaveBeenCalledWith("user_id", "00000000-0000-4000-8000-000000000099");
  });
});
