import "server-only";
import { getAiProviderEnv } from "@/lib/env";

type JsonSchema = {
  type: string | string[];
  properties?: Record<string, JsonSchema>;
  items?: JsonSchema;
  required?: string[];
  enum?: string[];
  additionalProperties?: boolean;
  maxItems?: number;
  maxLength?: number;
  minimum?: number;
  maximum?: number;
};

type AiCompletionInput = {
  prompt: string;
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
        schema: JsonSchema;
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

export type AiProviderErrorCode =
  | "AI_PROVIDER_NOT_CONFIGURED"
  | "RATE_LIMITED"
  | "AI_PROVIDER_AUTH_FAILED"
  | "AI_MODEL_NOT_FOUND"
  | "AI_REQUEST_FORMAT_INVALID"
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

const DEFAULT_PROVIDER_BASE_URL = "https://openrouter.ai/api/v1";
const CHAT_COMPLETIONS_PATH = "/chat/completions";
const REQUEST_TIMEOUT_MS = 60_000;

const shortStringSchema = {
  type: "string",
  maxLength: 160,
} as const satisfies JsonSchema;

const evidenceStringSchema = {
  type: "string",
  maxLength: 280,
} as const satisfies JsonSchema;

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
} as const satisfies JsonSchema;

export async function requestAiJsonCompletion({
  prompt,
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
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
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
        response_format: buildResponseFormat(),
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

    throw new AiProviderError({
      errorCode: "AI_REQUEST_FAILED",
      message: "The analysis request failed.",
      retryable: true,
    });
  } finally {
    clearTimeout(timeout);
  }
}

function buildProviderError(status: number): AiProviderError {
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

function skillRequirementSchema(): JsonSchema {
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

function feedbackStringArraySchema(maxItems = 12): JsonSchema {
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

  return `${baseUrl ?? DEFAULT_PROVIDER_BASE_URL}${CHAT_COMPLETIONS_PATH}`;
}

function buildResponseFormat(): AiResponseFormat {
  const { baseUrl } = getAiProviderEnv();
  const normalizedBaseUrl = baseUrl ?? DEFAULT_PROVIDER_BASE_URL;

  if (normalizedBaseUrl.includes("generativelanguage.googleapis.com")) {
    // Gemini's OpenAI-compatible layer can reject large JSON schemas. Zod
    // validation still enforces the full contract before scoring or saving.
    return { type: "json_object" };
  }

  return {
    type: "json_schema",
    json_schema: {
      name: "cv_match_analysis",
      strict: true,
      schema: CV_MATCH_RESPONSE_JSON_SCHEMA,
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
