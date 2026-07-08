export type ActionErrorPayload<Code extends string = string> = {
  code: Code
  message: string
}

export type ActionResult<T, Code extends string = string> =
  | {
      ok: true
      data: T
    }
  | {
      ok: false
      error: ActionErrorPayload<Code>
    }

export function createSuccessResult<T, Code extends string = string>(
  data: T
): ActionResult<T, Code> {
  return {
    ok: true,
    data,
  }
}

export function createErrorResult<Code extends string = string>(
  error: ActionErrorPayload<Code>
): ActionResult<never, Code> {
  return {
    ok: false,
    error,
  }
}
