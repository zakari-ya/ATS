import "server-only";
import { getAiProviderEnv } from "@/lib/env";

export type AiJsonSchema = {
  type: string | string[];
  properties?: Record<string, AiJsonSchema>;
  items?: AiJsonSchema;
  required?: string[];
  enum?: Array<string | number | boolean>;
  additionalProperties?: boolean;
  maxItems?: number;
  maxLength?: number;
  minimum?: number;
  maximum?: number;
};

type AiCompletionInput = {
  prompt: string;
  /** Use JSON mode without a provider schema for one-off, independently validated flows. */
  forceJsonObject?: boolean;
  /** Caller-specific deadline. Keep below the hosting function duration. */
  timeoutMs?: number;
  responseSchema?: {
    name: string;
    schema: AiJsonSchema;
  };
};

type AiCompletionResult = {
  content: string;
  model: string;
};

type AiResponseFormat =
  | {
      type: "json_object";
    }
  | {
      type: "json_schema";
      json_schema: {
        name: string;
        strict: boolean;
        schema: AiJsonSchema;
      };
    };

type ChatCompletionMessage = {
  content?: unknown;
};

type ChatCompletionChoice = {
  message?: ChatCompletionMessage;
};

type ChatCompletionResponse = {
  choices?: ChatCompletionChoice[];
};

type GeminiGenerateContentResponse = {
  candidates?: Array<{
    content?: {
      parts?: Array<{ text?: unknown }>;
    };
  }>;
};

export type AiProviderErrorCode =
  | "AI_PROVIDER_NOT_CONFIGURED"
  | "RATE_LIMITED"
  | "AI_PROVIDER_AUTH_FAILED"
  | "AI_MODEL_NOT_FOUND"
  | "AI_REQUEST_FORMAT_INVALID"
  | "AI_REQUEST_TIMEOUT"
  | "AI_REQUEST_FAILED";

export class AiProviderError extends Error {
  readonly errorCode: AiProviderErrorCode;
  readonly retryable: boolean;
  readonly providerStatus?: number;

  constructor({
    errorCode,
    message,
    retryable = false,
    providerStatus,
  }: {
    errorCode: AiProviderErrorCode;
    message: string;
    retryable?: boolean;
    providerStatus?: number;
  }) {
    super(message);
    this.name = "AiProviderError";
    this.errorCode = errorCode;
    this.retryable = retryable;
    this.providerStatus = providerStatus;
  }
}

const AI_PROVIDER_ERROR_CODES = new Set<AiProviderErrorCode>([
  "AI_PROVIDER_NOT_CONFIGURED",
  "RATE_LIMITED",
  "AI_PROVIDER_AUTH_FAILED",
  "AI_MODEL_NOT_FOUND",
  "AI_REQUEST_FORMAT_INVALID",
  "AI_REQUEST_TIMEOUT",
  "AI_REQUEST_FAILED",
]);

export function isAiProviderError(error: unknown): error is AiProviderError {
  if (error instanceof AiProviderError) return true;
  if (!error || typeof error !== "object") return false;
  const candidate = error as Record<string, unknown>;
  return (
    candidate.name === "AiProviderError" &&
    typeof candidate.errorCode === "string" &&
    AI_PROVIDER_ERROR_CODES.has(candidate.errorCode as AiProviderErrorCode) &&
    typeof candidate.retryable === "boolean"
  );
}

const DEFAULT_PROVIDER_BASE_URL = "https://openrouter.ai/api/v1";
const CHAT_COMPLETIONS_PATH = "/chat/completions";
const REQUEST_TIMEOUT_MS = 60_000;
const MAX_REQUEST_TIMEOUT_MS = 240_000;

const shortStringSchema = {
  type: "string",
  maxLength: 160,
} as const satisfies AiJsonSchema;

const evidenceStringSchema = {
  type: "string",
  maxLength: 280,
} as const satisfies AiJsonSchema;

const CV_MATCH_RESPONSE_JSON_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: [
    "input_quality",
    "job_profile",
    "cv_profile",
    "match_matrix",
    "feedback_inputs",
  ],
  properties: {
    input_quality: {
      type: "object",
      additionalProperties: false,
      required: [
        "cv_text_quality",
        "job_description_quality",
        "analysis_reliability",
        "warnings",
      ],
      properties: {
        cv_text_quality: {
          type: "string",
          enum: ["good", "medium", "poor"],
        },
        job_description_quality: {
          type: "string",
          enum: ["good", "medium", "poor"],
        },
        analysis_reliability: {
          type: "string",
          enum: ["high", "medium", "low"],
        },
        warnings: {
          type: "array",
          maxItems: 8,
          items: { type: "string", maxLength: 180 },
        },
      },
    },
    job_profile: {
      type: "object",
      additionalProperties: false,
      required: [
        "role_title",
        "seniority",
        "required_skills",
        "preferred_skills",
        "responsibilities",
        "experience_requirements",
      ],
      properties: {
        role_title: shortStringSchema,
        seniority: shortStringSchema,
        required_skills: {
          type: "array",
          maxItems: 30,
          items: skillRequirementSchema(),
        },
        preferred_skills: {
          type: "array",
          maxItems: 30,
          items: skillRequirementSchema(),
        },
        responsibilities: {
          type: "array",
          maxItems: 30,
          items: evidenceStringSchema,
        },
        experience_requirements: {
          type: "object",
          additionalProperties: false,
          required: ["minimum_years", "level", "evidence"],
          properties: {
            minimum_years: {
              type: ["number", "null"],
              minimum: 0,
              maximum: 60,
            },
            level: shortStringSchema,
            evidence: evidenceStringSchema,
          },
        },
      },
    },
    cv_profile: {
      type: "object",
      additionalProperties: false,
      required: ["detected_role", "skills", "projects", "experience_summary"],
      properties: {
        detected_role: shortStringSchema,
        skills: {
          type: "array",
          maxItems: 50,
          items: {
            type: "object",
            additionalProperties: false,
            required: ["name", "category", "evidence"],
            properties: {
              name: shortStringSchema,
              category: shortStringSchema,
              evidence: evidenceStringSchema,
            },
          },
        },
        projects: {
          type: "array",
          maxItems: 20,
          items: {
            type: "object",
            additionalProperties: false,
            required: ["name", "relevant_skills", "evidence"],
            properties: {
              name: shortStringSchema,
              relevant_skills: {
                type: "array",
                maxItems: 20,
                items: shortStringSchema,
              },
              evidence: evidenceStringSchema,
            },
          },
        },
        experience_summary: {
          type: "object",
          additionalProperties: false,
          required: ["estimated_level", "evidence"],
          properties: {
            estimated_level: shortStringSchema,
            evidence: evidenceStringSchema,
          },
        },
      },
    },
    match_matrix: {
      type: "array",
      maxItems: 80,
      items: {
        type: "object",
        additionalProperties: false,
        required: [
          "requirement",
          "priority",
          "category",
          "match_status",
          "match_strength",
          "confidence",
          "job_evidence",
          "cv_evidence",
          "reason",
        ],
        properties: {
          requirement: shortStringSchema,
          priority: {
            type: "string",
            enum: ["critical", "required", "preferred"],
          },
          category: shortStringSchema,
          match_status: {
            type: "string",
            enum: [
              "exact_match",
              "semantic_match",
              "partial_match",
              "unclear",
              "missing",
            ],
          },
          match_strength: {
            type: "number",
            minimum: 0,
            maximum: 1,
          },
          confidence: {
            type: "number",
            minimum: 0,
            maximum: 1,
          },
          job_evidence: evidenceStringSchema,
          cv_evidence: {
            type: ["string", "null"],
            maxLength: 280,
          },
          reason: {
            type: "string",
            maxLength: 360,
          },
        },
      },
    },
    feedback_inputs: {
      type: "object",
      additionalProperties: false,
      required: [
        "strong_points",
        "missing_required_items",
        "missing_preferred_items",
        "weak_points",
        "recommended_cv_improvements",
      ],
      properties: {
        strong_points: feedbackStringArraySchema(),
        missing_required_items: feedbackStringArraySchema(20),
        missing_preferred_items: feedbackStringArraySchema(20),
        weak_points: feedbackStringArraySchema(),
        recommended_cv_improvements: feedbackStringArraySchema(),
      },
    },
  },
} as const satisfies AiJsonSchema;

export async function requestAiJsonCompletion({
  prompt,
  forceJsonObject = false,
  timeoutMs = REQUEST_TIMEOUT_MS,
  responseSchema,
}: AiCompletionInput): Promise<AiCompletionResult> {
  let runtimeEnv: ReturnType<typeof getAiProviderEnv>;

  try {
    runtimeEnv = getAiProviderEnv();
  } catch {
    throw new AiProviderError({
      errorCode: "AI_PROVIDER_NOT_CONFIGURED",
      message: "The analysis service is not configured yet.",
    });
  }

  const { apiKey, model } = runtimeEnv;

  const controller = new AbortController();
  const requestTimeout = normalizeRequestTimeout(timeoutMs);
  const timeout = setTimeout(() => controller.abort(), requestTimeout);

  try {
    if (
      responseSchema &&
      !forceJsonObject &&
      isGeminiBaseUrl(runtimeEnv.baseUrl)
    ) {
      try {
        return await requestGeminiCompletion({
          apiKey,
          model,
          baseUrl: runtimeEnv.baseUrl!,
          prompt,
          responseSchema,
          signal: controller.signal,
        });
      } catch (error) {
        if (
          !isAiProviderError(error) ||
          error.errorCode !== "AI_REQUEST_FORMAT_INVALID"
        ) {
          throw error;
        }

        // Gemini can reject otherwise valid JSON Schema constraints for a
        // particular model. Retry once in JSON mode; caller-side Zod parsing
        // remains the authoritative validation boundary.
        return await requestGeminiCompletion({
          apiKey,
          model,
          baseUrl: runtimeEnv.baseUrl!,
          prompt,
          signal: controller.signal,
        });
      }
    }

    const response = await fetch(buildChatCompletionsUrl(), {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        messages: [{ role: "user", content: prompt }],
        temperature: 0.1,
        stream: false,
        response_format: buildResponseFormat(responseSchema, forceJsonObject),
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      throw buildProviderError(response.status);
    }

    const completion = (await response.json()) as ChatCompletionResponse;
    const content = extractMessageContent(completion);

    if (!content) {
      throw new AiProviderError({
        errorCode: "AI_REQUEST_FAILED",
        message: "The analysis response was empty.",
        retryable: true,
      });
    }

    return { content, model };
  } catch (error) {
    if (error instanceof AiProviderError) {
      throw error;
    }

    if (isAbortError(error)) {
      throw new AiProviderError({
        errorCode: "AI_REQUEST_TIMEOUT",
        message: "The analysis request took too long.",
        retryable: true,
      });
    }

    throw new AiProviderError({
      errorCode: "AI_REQUEST_FAILED",
      message: "The analysis request failed.",
      retryable: true,
    });
  } finally {
    clearTimeout(timeout);
  }
}

async function requestGeminiCompletion({
  apiKey,
  model,
  baseUrl,
  prompt,
  responseSchema,
  signal,
}: {
  apiKey: string;
  model: string;
  baseUrl: string;
  prompt: string;
  responseSchema?: NonNullable<AiCompletionInput["responseSchema"]>;
  signal: AbortSignal;
}): Promise<AiCompletionResult> {
  const nativeBaseUrl = baseUrl
    .replace(/\/+$/, "")
    .replace(/\/openai$/, "");
  const response = await fetch(
    `${nativeBaseUrl}/models/${encodeURIComponent(model)}:generateContent`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": apiKey,
      },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.1,
          responseMimeType: "application/json",
          ...(responseSchema
            ? { responseJsonSchema: responseSchema.schema }
            : {}),
        },
      }),
      signal,
    }
  );

  if (!response.ok) throw buildProviderError(response.status);

  const completion = (await response.json()) as GeminiGenerateContentResponse;
  const content = completion.candidates?.[0]?.content?.parts
    ?.map((part) => (typeof part.text === "string" ? part.text : ""))
    .join("");

  if (!content) {
    throw new AiProviderError({
      errorCode: "AI_REQUEST_FAILED",
      message: "The analysis response was empty.",
      retryable: true,
    });
  }

  return { content, model };
}

function buildProviderError(status: number): AiProviderError {
  if (status === 408 || status === 504) {
    return new AiProviderError({
      errorCode: "AI_REQUEST_TIMEOUT",
      message: "The analysis request took too long.",
      retryable: true,
      providerStatus: status,
    });
  }

  if (status === 400) {
    return new AiProviderError({
      errorCode: "AI_REQUEST_FORMAT_INVALID",
      message:
        "The analysis provider rejected the request format. Check the configured provider endpoint and model.",
      providerStatus: status,
    });
  }

  if (status === 401 || status === 403) {
    return new AiProviderError({
      errorCode: "AI_PROVIDER_AUTH_FAILED",
      message:
        "The analysis provider rejected the API key or project access. Check the configured API key.",
      providerStatus: status,
    });
  }

  if (status === 404) {
    return new AiProviderError({
      errorCode: "AI_MODEL_NOT_FOUND",
      message:
        "The analysis provider could not find the configured model. Check AI_MODEL.",
      providerStatus: status,
    });
  }

  if (status === 429) {
    return new AiProviderError({
      errorCode: "RATE_LIMITED",
      message:
        "The analysis service is temporarily rate-limited. Please try again shortly.",
      providerStatus: status,
    });
  }

  return new AiProviderError({
    errorCode: "AI_REQUEST_FAILED",
    message: "The analysis request failed.",
    retryable: status >= 500,
    providerStatus: status,
  });
}

function normalizeRequestTimeout(timeoutMs: number): number {
  if (!Number.isFinite(timeoutMs) || timeoutMs < 1_000) {
    return REQUEST_TIMEOUT_MS;
  }
  return Math.min(Math.floor(timeoutMs), MAX_REQUEST_TIMEOUT_MS);
}

function isAbortError(error: unknown): boolean {
  return (
    error instanceof Error &&
    (error.name === "AbortError" || error.name === "TimeoutError")
  );
}

function skillRequirementSchema(): AiJsonSchema {
  return {
    type: "object",
    additionalProperties: false,
    required: ["name", "category", "priority", "evidence"],
    properties: {
      name: shortStringSchema,
      category: shortStringSchema,
      priority: {
        type: "string",
        enum: ["critical", "required", "preferred"],
      },
      evidence: evidenceStringSchema,
    },
  };
}

function feedbackStringArraySchema(maxItems = 12): AiJsonSchema {
  return {
    type: "array",
    maxItems,
    items: {
      type: "string",
      maxLength: 260,
    },
  };
}

function buildChatCompletionsUrl(): string {
  const { baseUrl } = getAiProviderEnv();
  const normalizedBaseUrl = (baseUrl ?? DEFAULT_PROVIDER_BASE_URL).replace(
    /\/+$/,
    ""
  );

  return `${normalizedBaseUrl}${CHAT_COMPLETIONS_PATH}`;
}

function isGeminiBaseUrl(baseUrl: string | null): boolean {
  return Boolean(baseUrl?.includes("generativelanguage.googleapis.com"));
}

function buildResponseFormat(
  responseSchema?: AiCompletionInput["responseSchema"],
  forceJsonObject = false
): AiResponseFormat {
  const { baseUrl } = getAiProviderEnv();
  const normalizedBaseUrl = baseUrl ?? DEFAULT_PROVIDER_BASE_URL;

  if (
    forceJsonObject ||
    (!responseSchema &&
      normalizedBaseUrl.includes("generativelanguage.googleapis.com"))
  ) {
    // Keep legacy Gemini analysis requests in JSON mode. Callers with an
    // explicit schema are routed through Gemini's native structured endpoint.
    return { type: "json_object" };
  }

  return {
    type: "json_schema",
    json_schema: {
      name: responseSchema?.name ?? "cv_match_analysis",
      strict: true,
      schema: responseSchema?.schema ?? CV_MATCH_RESPONSE_JSON_SCHEMA,
    },
  };
}

function extractMessageContent(response: ChatCompletionResponse): string | null {
  const content = response.choices?.[0]?.message?.content;

  if (typeof content === "string") {
    return content;
  }

  if (Array.isArray(content)) {
    const text = content
      .map((part) =>
        typeof part === "object" &&
        part !== null &&
        "text" in part &&
        typeof part.text === "string"
          ? part.text
          : ""
      )
      .join("");

    return text || null;
  }

  if (typeof content === "object" && content !== null) {
    return JSON.stringify(content);
  }

  return null;
}
