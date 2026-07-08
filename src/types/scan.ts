export type ScanStatus =
  | "created"
  | "uploading"
  | "uploaded"
  | "validating_file"
  | "extracting_text"
  | "analyzing"
  | "scoring"
  | "completed"
  | "failed"
  | "deleted";

export type ScanLabel =
  | "great_match"
  | "good_match"
  | "needs_improvement"
  | "low_match";

export type DashboardScan = {
  id: string;
  jobTitle: string | null;
  currentStatus: ScanStatus;
  finalScore: number | null;
  finalLabel: ScanLabel | null;
  createdAt: string;
};

export type CreateRlsTestScanResult =
  | {
      ok: true;
      scanId: string;
      message: string;
    }
  | {
      ok: false;
      errorCode: "UNAUTHORIZED" | "DATABASE_WRITE_FAILED";
      message: string;
    };
