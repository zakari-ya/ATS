const URL_SCHEME_PATTERN = /^[a-z][a-z\d+.-]*:/i;
const SCHEMELESS_HOST_PATTERN =
  /^(?:www\.)?(?:[a-z\d](?:[a-z\d-]*[a-z\d])?\.)+[a-z]{2,}(?::\d{1,5})?(?:[/?#]|$)/i;

export function isSafeHttpUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return (
      (url.protocol === "http:" || url.protocol === "https:") &&
      Boolean(url.hostname) &&
      !url.username &&
      !url.password
    );
  } catch {
    return false;
  }
}

export function normalizeExtractedHttpUrl(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) return null;

  const candidate = URL_SCHEME_PATTERN.test(trimmed)
    ? trimmed
    : SCHEMELESS_HOST_PATTERN.test(trimmed)
      ? `https://${trimmed}`
      : null;

  return candidate && isSafeHttpUrl(candidate) ? candidate : null;
}
