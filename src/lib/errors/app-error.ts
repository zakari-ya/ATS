import {
  getSafeErrorMessage as getMappedSafeErrorMessage,
  type SafeErrorCode,
} from "@/lib/errors/error-messages"
import {
  createErrorResult,
  type ActionResult,
} from "@/lib/errors/safe-action-result"

export type AppErrorCode = SafeErrorCode

export type AppError = {
  code: AppErrorCode
  message: string
}

export function createAppError(
  code: AppErrorCode,
  message?: string
): AppError {
  return {
    code,
    message: message?.trim() || getMappedSafeErrorMessage(code),
  }
}

export function getSafeErrorMessage(code: AppErrorCode): string {
  return getMappedSafeErrorMessage(code)
}

export function isAppError(error: unknown): error is AppError {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    "message" in error &&
    typeof error.code === "string" &&
    typeof error.message === "string"
  )
}

export function toSafeActionResult<T>(
  error: unknown,
  fallbackCode: AppErrorCode = "UNKNOWN_ERROR"
): ActionResult<T, AppErrorCode> {
  if (isAppError(error)) {
    return createErrorResult(error)
  }

  return createErrorResult(createAppError(fallbackCode))
}
