import { beforeEach, describe, expect, it, vi } from "vitest";

const { createClientMock } = vi.hoisted(() => ({ createClientMock: vi.fn() }));
vi.mock("@/lib/supabase/server", () => ({ createClient: createClientMock }));

import { getResumeDraftForScan } from "@/lib/resume-builder/resume-draft-repository";

const SCAN_ID = "00000000-0000-4000-8000-000000000001";

describe("resume draft repository access", () => {
  beforeEach(() => createClientMock.mockReset());

  it("rejects unauthenticated access", async () => {
    createClientMock.mockResolvedValue({ auth: { getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }) } });
    await expect(getResumeDraftForScan(SCAN_ID)).resolves.toMatchObject({ ok: false, error: { code: "UNAUTHORIZED" } });
  });

  it("filters scan ownership before reading a draft", async () => {
    const maybeSingle = vi.fn().mockResolvedValue({ data: null, error: null });
    const userEq = vi.fn().mockReturnValue({ maybeSingle });
    const idEq = vi.fn().mockReturnValue({ eq: userEq });
    const select = vi.fn().mockReturnValue({ eq: idEq });
    const from = vi.fn().mockReturnValue({ select });
    createClientMock.mockResolvedValue({
      auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: "00000000-0000-4000-8000-000000000099" } }, error: null }) },
      from,
    });

    const result = await getResumeDraftForScan(SCAN_ID);
    expect(result).toMatchObject({ ok: false, error: { code: "SCAN_NOT_FOUND" } });
    expect(userEq).toHaveBeenCalledWith("user_id", "00000000-0000-4000-8000-000000000099");
  });
});
