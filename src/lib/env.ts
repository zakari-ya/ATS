type ServerEnvKey =
  | "NEXT_PUBLIC_SUPABASE_URL"
  | "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY"
  | "SUPABASE_SECRET_KEY"
  | "AI_PROVIDER"
  | "AI_PROVIDER_API_KEY"
  | "AI_PROVIDER_BASE_URL"
  | "AI_MODEL"
  | "NEXT_PUBLIC_APP_URL";

function readEnvValue(
  key: ServerEnvKey,
  env: NodeJS.ProcessEnv = process.env
): string | undefined {
  const value = env[key]?.trim();
  return value ? value : undefined;
}

function requireEnvValue(
  key: ServerEnvKey,
  options?: {
    message?: string;
    env?: NodeJS.ProcessEnv;
  }
): string {
  const value = readEnvValue(key, options?.env);

  if (!value) {
    throw new Error(options?.message ?? `Missing required environment variable: ${key}`);
  }

  return value;
}

function validateHttpUrl(
  value: string,
  key: ServerEnvKey
): string {
  let parsedUrl: URL;

  try {
    parsedUrl = new URL(value);
  } catch {
    throw new Error(`Invalid URL in environment variable: ${key}`);
  }

  if (parsedUrl.protocol !== "http:" && parsedUrl.protocol !== "https:") {
    throw new Error(`Invalid URL protocol in environment variable: ${key}`);
  }

  return parsedUrl.toString().replace(/\/$/, "");
}

export function getSupabasePublicEnv() {
  return {
    url: validateHttpUrl(
      requireEnvValue("NEXT_PUBLIC_SUPABASE_URL"),
      "NEXT_PUBLIC_SUPABASE_URL"
    ),
    publishableKey: requireEnvValue("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY"),
  } as const;
}

export function getSupabaseAdminEnv() {
  return {
    ...getSupabasePublicEnv(),
    secretKey: requireEnvValue("SUPABASE_SECRET_KEY"),
  } as const;
}

export function getAiProviderEnv() {
  const provider = readEnvValue("AI_PROVIDER") ?? "openai-compatible";
  const apiKey = requireEnvValue("AI_PROVIDER_API_KEY");
  const model = requireEnvValue("AI_MODEL");
  const baseUrl = readEnvValue("AI_PROVIDER_BASE_URL");

  return {
    provider,
    apiKey,
    model,
    baseUrl: baseUrl ? validateHttpUrl(baseUrl, "AI_PROVIDER_BASE_URL") : null,
  } as const;
}

export function getOptionalAppUrl(): string | null {
  const appUrl = readEnvValue("NEXT_PUBLIC_APP_URL");
  return appUrl ? validateHttpUrl(appUrl, "NEXT_PUBLIC_APP_URL") : null;
}
