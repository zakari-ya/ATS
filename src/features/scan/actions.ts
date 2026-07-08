"use server";

import { revalidatePath } from "next/cache";

import {
  createAppError,
  type AppErrorCode,
} from "@/lib/errors/app-error";
import {
  createErrorResult,
  createSuccessResult,
  type ActionResult,
} from "@/lib/errors/safe-action-result";
import { analyzeCvMatchWithAi } from "@/lib/ai/analyze-cv-match";
import { calculateCvMatchScore } from "@/lib/scoring/calculate-score";
import { createClient } from "@/lib/supabase/server";
import {
  CV_UPLOAD_BUCKET,
  deleteCvUploadFromStorage,
} from "@/lib/storage/cv-storage";
import { extractPdfText } from "@/lib/pdf/extract-text";
import {
  validateExtractedPdfText,
  validatePdfBuffer,
} from "@/lib/pdf/pdf-validation";
import {
  buildCvStoragePath,
  validateCvUploadMetadata,
} from "@/lib/security/file-rules";
import { validateJobDescriptionServer } from "@/lib/security/input-sanitizer";
import {
  checkDailyAiLimit,
  checkDailyScanLimit,
  checkDailyUploadLimit,
  incrementDailyUsageCounter,
} from "@/lib/security/usage-limits";
import type {
  AnalyzeCvMatchActionResult,
  CreateScanUploadResult,
  DeleteScanActionResult,
  ExtractCvTextResult,
  RetryScanActionResult,
} from "@/features/scan/types";
import type { AiCvMatchResponse, AiMatchMatrixItem } from "@/types/ai";
import type { CreateRlsTestScanResult } from "@/types/scan";
import type { CvMatchScoreResult } from "@/types/scoring";

type ServerSupabaseClient = Awaited<ReturnType<typeof createClient>>;

type ScanForExtraction = {
  id: string;
  user_id: string;
  current_status: string;
  cv_storage_path: string | null;
  cv_file_size: number | null;
  cv_content_type: string | null;
};

type ScanResultForAnalysis = {
  id: string;
  job_description: string;
  cv_extracted_text: string | null;
};

type SafeJsonValue =
  | string
  | number
  | boolean
  | null
  | SafeJsonValue[]
  | { [key: string]: SafeJsonValue };

function actionSuccess<T, Code extends AppErrorCode = AppErrorCode>(
  data: T
): ActionResult<T, Code> {
  return createSuccessResult<T, Code>(data);
}

function actionFailure<T, Code extends AppErrorCode>(
  code: Code,
  message?: string
): ActionResult<T, Code> {
  const error = createAppError(code, message);

  return createErrorResult<Code>({
    code,
    message: error.message,
  });
}

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

async function createScanStatusEvent({
  supabase,
  scanId,
  userId,
  status,
  message,
  safeMetadata = {},
}: {
  supabase: ServerSupabaseClient;
  scanId: string;
  userId: string;
  status: string;
  message: string;
  safeMetadata?: Record<string, string | number | boolean>;
}): Promise<boolean> {
  const { error } = await supabase.from("scan_status").insert({
    scan_id: scanId,
    user_id: userId,
    status,
    message,
    safe_metadata: safeMetadata,
  });

  return !error;
}

function revalidateUsageSurfaces(): void {
  revalidatePath("/dashboard");
  revalidatePath("/scan");
}

async function markScanFailed({
  supabase,
  scanId,
  userId,
  message,
  errorCode,
}: {
  supabase: ServerSupabaseClient;
  scanId: string;
  userId: string;
  message: string;
  errorCode: string;
}): Promise<void> {
  await supabase
    .from("scans")
    .update({ current_status: "failed" })
    .eq("id", scanId)
    .eq("user_id", userId);

  await supabase
    .from("scan_results")
    .update({
      error_code: errorCode,
      error_message: message,
    })
    .eq("scan_id", scanId)
    .eq("user_id", userId);

  await createScanStatusEvent({
    supabase,
    scanId,
    userId,
    status: "failed",
    message,
    safeMetadata: { error_code: errorCode },
  });
}

async function getUserOwnedScan({
  supabase,
  scanId,
  userId,
}: {
  supabase: ServerSupabaseClient;
  scanId: string;
  userId: string;
}): Promise<ScanForExtraction | null> {
  if (!UUID_PATTERN.test(scanId)) {
    return null;
  }

  const { data: scan, error } = await supabase
    .from("scans")
    .select(
      "id, user_id, current_status, cv_storage_path, cv_file_size, cv_content_type"
    )
    .eq("id", scanId)
    .eq("user_id", userId)
    .maybeSingle<ScanForExtraction>();

  if (error || !scan || scan.user_id !== userId) {
    return null;
  }

  return scan;
}

async function scanResultExists({
  supabase,
  scanId,
  userId,
}: {
  supabase: ServerSupabaseClient;
  scanId: string;
  userId: string;
}): Promise<boolean> {
  const { data: scanResult, error } = await supabase
    .from("scan_results")
    .select("id")
    .eq("scan_id", scanId)
    .eq("user_id", userId)
    .maybeSingle<{ id: string }>();

  return !error && Boolean(scanResult?.id);
}

async function getScanResultForAnalysis({
  supabase,
  scanId,
  userId,
}: {
  supabase: ServerSupabaseClient;
  scanId: string;
  userId: string;
}): Promise<ScanResultForAnalysis | null> {
  const { data: scanResult, error } = await supabase
    .from("scan_results")
    .select("id, job_description, cv_extracted_text")
    .eq("scan_id", scanId)
    .eq("user_id", userId)
    .maybeSingle<ScanResultForAnalysis>();

  if (error || !scanResult) {
    return null;
  }

  return scanResult;
}

function mapMatchedSkills(aiResponse: AiCvMatchResponse): SafeJsonValue[] {
  return aiResponse.match_matrix
    .filter((item) =>
      ["exact_match", "semantic_match", "partial_match"].includes(
        item.match_status
      )
    )
    .map(mapMatchMatrixItemForStorage);
}

function mapMissingRequiredSkills(
  aiResponse: AiCvMatchResponse
): SafeJsonValue[] {
  return aiResponse.match_matrix
    .filter(
      (item) =>
        (item.priority === "critical" || item.priority === "required") &&
        item.match_status === "missing"
    )
    .map(mapMatchMatrixItemForStorage);
}

function mapMissingPreferredSkills(
  aiResponse: AiCvMatchResponse
): SafeJsonValue[] {
  return aiResponse.match_matrix
    .filter(
      (item) => item.priority === "preferred" && item.match_status === "missing"
    )
    .map(mapMatchMatrixItemForStorage);
}

function mapMatchMatrixItemForStorage(item: AiMatchMatrixItem): SafeJsonValue {
  return {
    requirement: item.requirement,
    priority: item.priority,
    category: item.category,
    match_status: item.match_status,
    confidence: item.confidence,
    job_evidence: item.job_evidence,
    cv_evidence: item.cv_evidence,
    reason: item.reason,
  };
}

function mapScoreBreakdownForStorage(
  scoreResult: CvMatchScoreResult
): SafeJsonValue {
  return {
    requiredRequirementsScore:
      scoreResult.breakdown.requiredRequirementsScore,
    preferredSkillsScore: scoreResult.breakdown.preferredSkillsScore,
    experienceRelevanceScore:
      scoreResult.breakdown.experienceRelevanceScore,
    projectEvidenceScore: scoreResult.breakdown.projectEvidenceScore,
    cvClarityScore: scoreResult.breakdown.cvClarityScore,
    baseWeightedScore: scoreResult.breakdown.baseWeightedScore,
    finalScore: scoreResult.breakdown.finalScore,
    finalLabel: scoreResult.breakdown.finalLabel,
    counts: scoreResult.counts,
  };
}

async function downloadCvFromStorage({
  supabase,
  storagePath,
}: {
  supabase: ServerSupabaseClient;
  storagePath: string;
}): Promise<Blob | null> {
  const { data, error } = await supabase.storage
    .from(CV_UPLOAD_BUCKET)
    .download(storagePath);

  if (error || !data) {
    return null;
  }

  return data;
}

export async function createScanWithCvUpload(
  formData: FormData
): Promise<CreateScanUploadResult> {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return actionFailure("UNAUTHORIZED");
  }

  const jobDescriptionValue = formData.get("jobDescription");
  const cvFileValue = formData.get("cvFile");
  const jobDescriptionValidation = validateJobDescriptionServer(
    typeof jobDescriptionValue === "string" ? jobDescriptionValue : ""
  );
  const cvFile = cvFileValue instanceof File ? cvFileValue : null;
  const cvMetadataValidation = validateCvUploadMetadata(cvFile);

  if (!jobDescriptionValidation.valid) {
    return actionFailure(
      jobDescriptionValidation.errorCode,
      jobDescriptionValidation.message
    );
  }

  if (!cvMetadataValidation.valid) {
    return actionFailure(
      cvMetadataValidation.errorCode,
      cvMetadataValidation.message
    );
  }

  if (!cvFile) {
    return actionFailure(
      "INVALID_FILE_TYPE",
      "Upload a PDF CV before starting the analysis."
    );
  }

  const cvMetadata = cvMetadataValidation.value;
  const uploadPdfValidation = validatePdfBuffer({
    buffer: await cvFile.arrayBuffer(),
    contentType: cvMetadata.contentType,
    storagePath: "cv.pdf",
  });

  if (!uploadPdfValidation.valid) {
    return actionFailure(
      uploadPdfValidation.errorCode,
      uploadPdfValidation.message
    );
  }

  const scanLimit = await checkDailyScanLimit({ userId: user.id });

  if (!scanLimit.ok) {
    return actionFailure(scanLimit.errorCode, scanLimit.message);
  }

  const uploadLimit = await checkDailyUploadLimit({ userId: user.id });

  if (!uploadLimit.ok) {
    return actionFailure(uploadLimit.errorCode, uploadLimit.message);
  }

  const { data: scan, error: scanError } = await supabase
    .from("scans")
    .insert({
      user_id: user.id,
      current_status: "uploading",
    })
    .select("id")
    .single();

  if (scanError || !scan?.id) {
    return actionFailure(
      "DATABASE_WRITE_FAILED",
      "We could not create the scan. Please try again."
    );
  }

  const scanId = String(scan.id);
  const scanUsageIncrement = await incrementDailyUsageCounter({
    userId: user.id,
    counterName: "scans_used",
  });

  if (!scanUsageIncrement.ok) {
    await markScanFailed({
      supabase,
      scanId,
      userId: user.id,
      message: scanUsageIncrement.message,
      errorCode: scanUsageIncrement.errorCode,
    });

    return actionFailure(
      scanUsageIncrement.errorCode,
      scanUsageIncrement.message
    );
  }

  revalidateUsageSurfaces();

  const createdStatusSaved = await createScanStatusEvent({
    supabase,
    scanId,
    userId: user.id,
    status: "created",
    message: "Scan created.",
  });

  if (!createdStatusSaved) {
    await markScanFailed({
      supabase,
      scanId,
      userId: user.id,
      message: "The scan timeline could not be started.",
      errorCode: "DATABASE_WRITE_FAILED",
    });

    return actionFailure(
      "DATABASE_WRITE_FAILED",
      "We could not create the scan. Please try again."
    );
  }

  const { error: resultError } = await supabase.from("scan_results").insert({
    scan_id: scanId,
    user_id: user.id,
    job_description: jobDescriptionValidation.value,
    ai_validation_status: "pending",
  });

  if (resultError) {
    await markScanFailed({
      supabase,
      scanId,
      userId: user.id,
      message: "The scan details could not be saved.",
      errorCode: "DATABASE_WRITE_FAILED",
    });

    return actionFailure(
      "DATABASE_WRITE_FAILED",
      "We could not save the scan details. Please try again."
    );
  }

  const cvStoragePath = buildCvStoragePath(user.id, scanId);
  const { error: uploadError } = await supabase.storage
    .from(CV_UPLOAD_BUCKET)
    .upload(cvStoragePath, cvFile, {
      contentType: cvMetadata.contentType,
      upsert: false,
    });

  if (uploadError) {
    await markScanFailed({
      supabase,
      scanId,
      userId: user.id,
      message: "The CV upload could not be completed.",
      errorCode: "STORAGE_UPLOAD_FAILED",
    });

    return actionFailure(
      "STORAGE_UPLOAD_FAILED",
      "We could not upload the CV. Please try again."
    );
  }

  const uploadUsageIncrement = await incrementDailyUsageCounter({
    userId: user.id,
    counterName: "files_uploaded",
  });

  if (!uploadUsageIncrement.ok) {
    await markScanFailed({
      supabase,
      scanId,
      userId: user.id,
      message: uploadUsageIncrement.message,
      errorCode: uploadUsageIncrement.errorCode,
    });

    return actionFailure(
      uploadUsageIncrement.errorCode,
      uploadUsageIncrement.message
    );
  }

  revalidateUsageSurfaces();

  const { error: scanUpdateError } = await supabase
    .from("scans")
    .update({
      cv_storage_path: cvStoragePath,
      cv_file_name: cvMetadata.originalFileName,
      cv_file_size: cvMetadata.fileSize,
      cv_content_type: cvMetadata.contentType,
      current_status: "uploaded",
    })
    .eq("id", scanId)
    .eq("user_id", user.id);

  if (scanUpdateError) {
    await markScanFailed({
      supabase,
      scanId,
      userId: user.id,
      message: "The scan summary could not be updated.",
      errorCode: "DATABASE_WRITE_FAILED",
    });

    return actionFailure(
      "DATABASE_WRITE_FAILED",
      "The CV uploaded, but the scan could not be finalized."
    );
  }

  const uploadedStatusSaved = await createScanStatusEvent({
    supabase,
    scanId,
    userId: user.id,
    status: "uploaded",
    message: "CV uploaded.",
    safeMetadata: {
      file_size: cvMetadata.fileSize,
      content_type: cvMetadata.contentType,
    },
  });

  if (!uploadedStatusSaved) {
    await markScanFailed({
      supabase,
      scanId,
      userId: user.id,
      message: "The upload timeline could not be saved.",
      errorCode: "DATABASE_WRITE_FAILED",
    });

    return actionFailure(
      "DATABASE_WRITE_FAILED",
      "The CV uploaded, but the scan timeline could not be updated."
    );
  }

  revalidatePath("/dashboard");
  revalidatePath("/scan");

  return actionSuccess({
    scanId,
    message: "CV uploaded. Reading CV text next.",
  });
}

export async function extractCvTextForScan(
  scanId: string
): Promise<ExtractCvTextResult> {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return actionFailure("UNAUTHORIZED");
  }

  const scan = await getUserOwnedScan({
    supabase,
    scanId,
    userId: user.id,
  });

  if (!scan) {
    return actionFailure("SCAN_NOT_FOUND");
  }

  if (!scan.cv_storage_path) {
    await markScanFailed({
      supabase,
      scanId,
      userId: user.id,
      message: "The uploaded CV file could not be found.",
      errorCode: "CV_FILE_NOT_FOUND",
    });

    return actionFailure("CV_FILE_NOT_FOUND");
  }

  const hasScanResult = await scanResultExists({
    supabase,
    scanId,
    userId: user.id,
  });

  if (!hasScanResult) {
    await markScanFailed({
      supabase,
      scanId,
      userId: user.id,
      message: "The scan details could not be found.",
      errorCode: "DATABASE_WRITE_FAILED",
    });

    return actionFailure(
      "DATABASE_WRITE_FAILED",
      "We could not find the scan details."
    );
  }

  const { error: extractingStatusError } = await supabase
    .from("scans")
    .update({ current_status: "extracting_text" })
    .eq("id", scanId)
    .eq("user_id", user.id);

  if (extractingStatusError) {
    return actionFailure(
      "DATABASE_WRITE_FAILED",
      "We could not update the scan status."
    );
  }

  const extractionEventSaved = await createScanStatusEvent({
    supabase,
    scanId,
    userId: user.id,
    status: "extracting_text",
    message: "Reading CV text.",
  });

  if (!extractionEventSaved) {
    await markScanFailed({
      supabase,
      scanId,
      userId: user.id,
      message: "The extraction timeline could not be saved.",
      errorCode: "DATABASE_WRITE_FAILED",
    });

    return actionFailure(
      "DATABASE_WRITE_FAILED",
      "We could not update the scan timeline."
    );
  }

  const cvBlob = await downloadCvFromStorage({
    supabase,
    storagePath: scan.cv_storage_path,
  });

  if (!cvBlob) {
    await markScanFailed({
      supabase,
      scanId,
      userId: user.id,
      message: "The CV download could not be completed.",
      errorCode: "STORAGE_DOWNLOAD_FAILED",
    });

    return actionFailure("STORAGE_DOWNLOAD_FAILED");
  }

  const pdfBuffer = await cvBlob.arrayBuffer();
  const pdfValidation = validatePdfBuffer({
    buffer: pdfBuffer,
    contentType: cvBlob.type || scan.cv_content_type,
    storagePath: scan.cv_storage_path,
  });

  if (!pdfValidation.valid) {
    await markScanFailed({
      supabase,
      scanId,
      userId: user.id,
      message: pdfValidation.message,
      errorCode: pdfValidation.errorCode,
    });

    return actionFailure(pdfValidation.errorCode, pdfValidation.message);
  }

  let extractedPdf;

  try {
    extractedPdf = await extractPdfText(pdfValidation.value);
  } catch {
    await markScanFailed({
      supabase,
      scanId,
      userId: user.id,
      message: "We could not safely read this PDF. Please upload a clean text-based PDF under 5MB.",
      errorCode: "PDF_TEXT_EXTRACTION_FAILED",
    });

    return actionFailure(
      "PDF_TEXT_EXTRACTION_FAILED",
      "We could not safely read this PDF. Please upload a clean text-based PDF under 5MB."
    );
  }

  const extractedTextValidation = validateExtractedPdfText(extractedPdf.text);

  if (!extractedTextValidation.valid) {
    await markScanFailed({
      supabase,
      scanId,
      userId: user.id,
      message: extractedTextValidation.message,
      errorCode: extractedTextValidation.errorCode,
    });

    return actionFailure(
      extractedTextValidation.errorCode,
      extractedTextValidation.message
    );
  }

  const { error: resultUpdateError } = await supabase
    .from("scan_results")
    .update({
      cv_extracted_text: extractedTextValidation.value,
      cv_text_char_count: extractedPdf.charCount,
      error_code: null,
      error_message: null,
    })
    .eq("scan_id", scanId)
    .eq("user_id", user.id);

  if (resultUpdateError) {
    await markScanFailed({
      supabase,
      scanId,
      userId: user.id,
      message: "The extracted CV text could not be saved.",
      errorCode: "DATABASE_WRITE_FAILED",
    });

    return actionFailure(
      "DATABASE_WRITE_FAILED",
      "We could not save the extracted CV text."
    );
  }

  const { error: scanUpdateError } = await supabase
    .from("scans")
    .update({ current_status: "uploaded" })
    .eq("id", scanId)
    .eq("user_id", user.id);

  if (scanUpdateError) {
    await markScanFailed({
      supabase,
      scanId,
      userId: user.id,
      message: "The scan status could not be updated after extraction.",
      errorCode: "DATABASE_WRITE_FAILED",
    });

    return actionFailure(
      "DATABASE_WRITE_FAILED",
      "We could not update the scan status."
    );
  }

  const textExtractedEventSaved = await createScanStatusEvent({
    supabase,
    scanId,
    userId: user.id,
    status: "text_extracted",
    message: "CV text extracted.",
    safeMetadata: {
      char_count: extractedPdf.charCount,
      page_count: extractedPdf.pageCount ?? 0,
    },
  });

  if (!textExtractedEventSaved) {
    await markScanFailed({
      supabase,
      scanId,
      userId: user.id,
      message: "The extraction timeline could not be completed.",
      errorCode: "DATABASE_WRITE_FAILED",
    });

    return actionFailure(
      "DATABASE_WRITE_FAILED",
      "We could not finish the extraction timeline."
    );
  }

  revalidatePath("/dashboard");
  revalidatePath("/scan");

  return actionSuccess({
    scanId,
    charCount: extractedPdf.charCount,
    pageCount: extractedPdf.pageCount,
    message: "CV text extracted successfully. AI analysis is ready to start.",
  });
}

export async function analyzeCvMatchForScan(
  scanId: string
): Promise<AnalyzeCvMatchActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return actionFailure("UNAUTHORIZED");
  }

  const scan = await getUserOwnedScan({
    supabase,
    scanId,
    userId: user.id,
  });

  if (!scan) {
    return actionFailure("SCAN_NOT_FOUND");
  }

  const scanResult = await getScanResultForAnalysis({
    supabase,
    scanId,
    userId: user.id,
  });

  if (!scanResult?.job_description || !scanResult.cv_extracted_text) {
    await markScanFailed({
      supabase,
      scanId,
      userId: user.id,
      message: "The scan is missing the required analysis inputs.",
      errorCode: "AI_ANALYSIS_FAILED",
    });

    return actionFailure(
      "AI_ANALYSIS_FAILED",
      "The analysis inputs are not ready. Please try again."
    );
  }

  const aiLimit = await checkDailyAiLimit({ userId: user.id });

  if (!aiLimit.ok) {
    return actionFailure(aiLimit.errorCode, aiLimit.message);
  }

  const aiUsageIncrement = await incrementDailyUsageCounter({
    userId: user.id,
    counterName: "ai_requests_used",
  });

  if (!aiUsageIncrement.ok) {
    return actionFailure(
      aiUsageIncrement.errorCode,
      aiUsageIncrement.message
    );
  }

  revalidateUsageSurfaces();

  const { error: analyzingStatusError } = await supabase
    .from("scans")
    .update({ current_status: "analyzing" })
    .eq("id", scanId)
    .eq("user_id", user.id);

  if (analyzingStatusError) {
    return actionFailure(
      "DATABASE_WRITE_FAILED",
      "We could not update the scan status."
    );
  }

  const analyzingEventSaved = await createScanStatusEvent({
    supabase,
    scanId,
    userId: user.id,
    status: "analyzing",
    message: "Comparing CV text with the job post.",
  });

  if (!analyzingEventSaved) {
    await markScanFailed({
      supabase,
      scanId,
      userId: user.id,
      message: "The analysis timeline could not be saved.",
      errorCode: "DATABASE_WRITE_FAILED",
    });

    return actionFailure(
      "DATABASE_WRITE_FAILED",
      "We could not update the scan timeline."
    );
  }

  const aiAnalysis = await analyzeCvMatchWithAi({
    jobDescription: scanResult.job_description,
    cvText: scanResult.cv_extracted_text,
  });

  if (!aiAnalysis.ok) {
    if (aiAnalysis.errorCode === "AI_JSON_INVALID") {
      await supabase
        .from("scan_results")
        .update({ ai_validation_status: "invalid" })
        .eq("scan_id", scanId)
        .eq("user_id", user.id);
    }

    await markScanFailed({
      supabase,
      scanId,
      userId: user.id,
      message: aiAnalysis.message,
      errorCode: aiAnalysis.errorCode,
    });

    return actionFailure(aiAnalysis.errorCode, aiAnalysis.message);
  }

  const scoringEventSaved = await createScanStatusEvent({
    supabase,
    scanId,
    userId: user.id,
    status: "scoring",
    message: "Calculating the backend score.",
  });

  if (!scoringEventSaved) {
    await markScanFailed({
      supabase,
      scanId,
      userId: user.id,
      message: "The scoring timeline could not be saved.",
      errorCode: "DATABASE_WRITE_FAILED",
    });

    return actionFailure(
      "DATABASE_WRITE_FAILED",
      "We could not update the scan timeline."
    );
  }

  const { error: scoringStatusError } = await supabase
    .from("scans")
    .update({ current_status: "scoring" })
    .eq("id", scanId)
    .eq("user_id", user.id);

  if (scoringStatusError) {
    await markScanFailed({
      supabase,
      scanId,
      userId: user.id,
      message: "The scoring status could not be saved.",
      errorCode: "DATABASE_WRITE_FAILED",
    });

    return actionFailure(
      "DATABASE_WRITE_FAILED",
      "We could not update the scan status."
    );
  }

  let scoreResult: CvMatchScoreResult;

  try {
    scoreResult = calculateCvMatchScore(aiAnalysis.aiResponse);
  } catch {
    await markScanFailed({
      supabase,
      scanId,
      userId: user.id,
      message: "The backend score could not be calculated.",
      errorCode: "SCORING_FAILED",
    });

    return actionFailure("SCORING_FAILED", "The analysis failed. Please try again.");
  }

  const { error: resultUpdateError } = await supabase
    .from("scan_results")
    .update({
      ai_json: aiAnalysis.aiResponse,
      ai_schema_version: "v1",
      ai_validation_status: "valid",
      final_score: scoreResult.finalScore,
      final_label: scoreResult.finalLabel,
      score_breakdown: mapScoreBreakdownForStorage(scoreResult),
      matched_skills: mapMatchedSkills(aiAnalysis.aiResponse),
      missing_required_skills: mapMissingRequiredSkills(aiAnalysis.aiResponse),
      missing_preferred_skills: mapMissingPreferredSkills(aiAnalysis.aiResponse),
      strong_points: aiAnalysis.aiResponse.feedback_inputs.strong_points,
      weak_points: aiAnalysis.aiResponse.feedback_inputs.weak_points,
      recommendations:
        aiAnalysis.aiResponse.feedback_inputs.recommended_cv_improvements,
      applied_caps: scoreResult.breakdown.appliedCaps,
      prompt_version: "v1",
      score_version: scoreResult.scoreVersion,
      error_code: null,
      error_message: null,
    })
    .eq("scan_id", scanId)
    .eq("user_id", user.id);

  if (resultUpdateError) {
    await markScanFailed({
      supabase,
      scanId,
      userId: user.id,
      message: "The analysis result could not be saved.",
      errorCode: "DATABASE_WRITE_FAILED",
    });

    return actionFailure(
      "DATABASE_WRITE_FAILED",
      "We could not save the analysis result."
    );
  }

  const { error: scanUpdateError } = await supabase
    .from("scans")
    .update({
      current_status: "completed",
      final_score: scoreResult.finalScore,
      final_label: scoreResult.finalLabel,
      completed_at: new Date().toISOString(),
    })
    .eq("id", scanId)
    .eq("user_id", user.id);

  if (scanUpdateError) {
    await markScanFailed({
      supabase,
      scanId,
      userId: user.id,
      message: "The completed scan summary could not be saved.",
      errorCode: "DATABASE_WRITE_FAILED",
    });

    return actionFailure(
      "DATABASE_WRITE_FAILED",
      "We could not save the completed scan summary."
    );
  }

  const completedEventSaved = await createScanStatusEvent({
    supabase,
    scanId,
    userId: user.id,
    status: "completed",
    message: "Analysis completed.",
    safeMetadata: {
      final_score: scoreResult.finalScore,
      final_label: scoreResult.finalLabel,
      model: aiAnalysis.model,
    },
  });

  if (!completedEventSaved) {
    await markScanFailed({
      supabase,
      scanId,
      userId: user.id,
      message: "The completed timeline event could not be saved.",
      errorCode: "DATABASE_WRITE_FAILED",
    });

    return actionFailure(
      "DATABASE_WRITE_FAILED",
      "The analysis completed, but the timeline could not be updated."
    );
  }

  revalidatePath("/dashboard");
  revalidatePath("/scan");

  return actionSuccess({
    scanId,
    finalScore: scoreResult.finalScore,
    finalLabel: scoreResult.labelText,
    message: "Analysis complete. Backend score is ready.",
  });
}

export async function retryFailedScanAction(
  scanId: string
): Promise<RetryScanActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return actionFailure("UNAUTHORIZED");
  }

  const scan = await getUserOwnedScan({
    supabase,
    scanId,
    userId: user.id,
  });

  if (!scan) {
    return actionFailure("SCAN_NOT_FOUND");
  }

  const scanResult = await getScanResultForAnalysis({
    supabase,
    scanId,
    userId: user.id,
  });

  if (scan.current_status !== "failed" || !scanResult?.job_description) {
    return actionFailure("RETRY_NOT_AVAILABLE");
  }

  if (scanResult.cv_extracted_text) {
    const analysisResult = await analyzeCvMatchForScan(scanId);

    if (!analysisResult.ok) {
      return analysisResult;
    }

    return actionSuccess({
      scanId: analysisResult.data.scanId,
      stage: "analyzed",
      message: "The analysis was retried successfully.",
    });
  }

  if (!scan.cv_storage_path) {
    return actionFailure("CV_FILE_NOT_FOUND");
  }

  const extractionResult = await extractCvTextForScan(scanId);

  if (!extractionResult.ok) {
    return extractionResult;
  }

  const analysisResult = await analyzeCvMatchForScan(scanId);

  if (!analysisResult.ok) {
    return analysisResult;
  }

  return actionSuccess({
    scanId: analysisResult.data.scanId,
    stage: "extracted_then_analyzed",
    message: "The scan was retried successfully.",
  });
}

export async function deleteScanAction(
  scanId: string
): Promise<DeleteScanActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return actionFailure("UNAUTHORIZED");
  }

  const scan = await getUserOwnedScan({
    supabase,
    scanId,
    userId: user.id,
  });

  if (!scan) {
    return actionFailure("SCAN_NOT_FOUND");
  }

  const storageDeleteResult = await deleteCvUploadFromStorage({
    supabase,
    storagePath: scan.cv_storage_path,
  });

  if (!storageDeleteResult.ok) {
    return actionFailure(
      storageDeleteResult.errorCode,
      storageDeleteResult.message
    );
  }

  const { error: deleteError } = await supabase
    .from("scans")
    .delete()
    .eq("id", scanId)
    .eq("user_id", user.id);

  if (deleteError) {
    return actionFailure("DATABASE_DELETE_FAILED");
  }

  revalidatePath("/dashboard");
  revalidatePath("/history");
  revalidatePath("/scan");
  revalidatePath(`/scan/${scanId}`);

  return actionSuccess({
    cleanupWarning: storageDeleteResult.cleanupWarning,
    message: storageDeleteResult.cleanupWarning
      ? storageDeleteResult.message
      : "The scan was deleted successfully.",
  });
}

export async function createRlsTestScan(): Promise<CreateRlsTestScanResult> {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return {
      ok: false,
      errorCode: "UNAUTHORIZED",
      message: "Sign in again before creating a test scan.",
    };
  }

  const { data: scan, error: scanError } = await supabase
    .from("scans")
    .insert({
      user_id: user.id,
      job_title: "RLS Test Scan",
      current_status: "created",
    })
    .select("id")
    .single();

  if (scanError || !scan?.id) {
    return {
      ok: false,
      errorCode: "DATABASE_WRITE_FAILED",
      message: "The test scan could not be created.",
    };
  }

  const scanId = String(scan.id);

  const { error: statusError } = await supabase.from("scan_status").insert({
    scan_id: scanId,
    user_id: user.id,
    status: "created",
    message: "RLS test scan created.",
    safe_metadata: {
      source: "dev_rls_test",
    },
  });

  if (statusError) {
    return {
      ok: false,
      errorCode: "DATABASE_WRITE_FAILED",
      message: "The test scan was created, but its status event was not saved.",
    };
  }

  return {
    ok: true,
    scanId,
    message: "RLS test scan created.",
  };
}
