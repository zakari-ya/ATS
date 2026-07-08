export const SAFE_ERROR_MESSAGES = {
  UNAUTHORIZED: "You need to sign in again.",
  SCAN_NOT_FOUND: "We could not find this scan.",
  CV_FILE_NOT_FOUND: "We could not find the uploaded CV file.",
  RETRY_NOT_AVAILABLE: "This scan is not ready to retry yet.",
  INVALID_FILE_TYPE: "Please upload a PDF file.",
  FILE_TOO_LARGE: "Your PDF is too large. Please upload a file under 5 MB.",
  PDF_MAGIC_BYTES_INVALID:
    "We could not safely read this PDF. Please upload a clean text-based PDF under 5MB.",
  PDF_TEXT_EXTRACTION_FAILED:
    "We could not safely read this PDF. Please upload a clean text-based PDF under 5MB.",
  CV_TEXT_TOO_SHORT:
    "This PDF looks like a scanned image. Please upload a text-based CV PDF where the text is selectable.",
  CV_TEXT_TOO_LONG:
    "This PDF could not be processed safely. Please upload a shorter text-based CV PDF.",
  EMPTY_CV_TEXT:
    "This PDF does not contain enough readable text. Please upload a clean text-based CV PDF.",
  JOB_DESCRIPTION_TOO_SHORT:
    "This job description is too short. Please paste the full job post.",
  JOB_DESCRIPTION_TOO_LONG:
    "Keep the job description under 20,000 characters.",
  AI_PROVIDER_NOT_CONFIGURED: "The analysis service is not configured yet.",
  AI_PROVIDER_AUTH_FAILED:
    "The analysis service credentials are not valid right now.",
  AI_MODEL_NOT_FOUND:
    "The selected analysis model is not available. Check the configured model name.",
  AI_REQUEST_FORMAT_INVALID:
    "The analysis provider rejected the request format. Check the configured provider endpoint and model.",
  AI_REQUEST_FAILED: "The analysis failed. Please try again.",
  AI_JSON_INVALID:
    "We could not validate the analysis safely. Please try again.",
  AI_ANALYSIS_FAILED: "The analysis failed. Please try again.",
  RATE_LIMITED:
    "The analysis service is temporarily rate-limited. Please try again shortly.",
  DAILY_SCAN_LIMIT_REACHED:
    "You reached your daily scan limit. Please try again tomorrow.",
  DAILY_UPLOAD_LIMIT_REACHED:
    "You reached your daily upload limit. Please try again tomorrow.",
  DAILY_AI_LIMIT_REACHED:
    "You reached your daily analysis limit. Please try again tomorrow.",
  USAGE_COUNTER_FAILED:
    "We could not verify your daily usage. Please try again.",
  STORAGE_DOWNLOAD_FAILED: "We could not download the uploaded CV.",
  STORAGE_UPLOAD_FAILED: "We could not upload the CV. Please try again.",
  STORAGE_DELETE_FAILED:
    "The scan was deleted, but the file cleanup needs to be retried.",
  DATABASE_WRITE_FAILED: "Something went wrong. Please try again.",
  DATABASE_DELETE_FAILED:
    "This scan could not be deleted. Please try again.",
  DELETE_NOT_ALLOWED: "This scan could not be deleted. Please try again.",
  DELETE_FAILED: "This scan could not be deleted. Please try again.",
  SCORING_FAILED: "The analysis failed. Please try again.",
  UNKNOWN_ERROR: "Something went wrong. Please try again.",
} as const

export type SafeErrorCode = keyof typeof SAFE_ERROR_MESSAGES

export function getSafeErrorMessage(code: SafeErrorCode): string {
  return SAFE_ERROR_MESSAGES[code]
}
