import { afterEach, describe, expect, it, vi } from "vitest";

import { AiProviderError, requestAiJsonCompletion } from "@/lib/ai/client";
import type { AiJsonSchema } from "@/lib/ai/client";

const responseSchema = {
  name: "test_extraction",
  schema: {
    type: "object",
    additionalProperties: false,
    required: ["value"],
    properties: { value: { type: "string" } },
  },
} satisfies { name: string; schema: AiJsonSchema };

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe("AI client response format", () => {
  it("sends an explicit JSON schema through Gemini's native structured endpoint", async () => {
    stubAiEnvironment("https://generativelanguage.googleapis.com/v1beta/openai");
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          candidates: [
            { content: { parts: [{ text: '{"value":"ok"}' }] } },
          ],
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      )
    );
    vi.stubGlobal("fetch", fetchMock);

    await requestAiJsonCompletion({ prompt: "Return JSON", responseSchema });

    expect(fetchMock.mock.calls[0]?.[0]).toBe(
      "https://generativelanguage.googleapis.com/v1beta/models/fictional-test-model:generateContent"
    );
    const request = JSON.parse(String(fetchMock.mock.calls[0]?.[1]?.body)) as {
      generationConfig: {
        responseMimeType: unknown;
        responseJsonSchema: unknown;
      };
    };
    expect(request.generationConfig.responseMimeType).toBe("application/json");
    expect(request.generationConfig.responseJsonSchema).toEqual(
      responseSchema.schema
    );
  });

  it("parses Gemini's native structured response", async () => {
    stubAiEnvironment("https://generativelanguage.googleapis.com/v1beta/openai");
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            candidates: [
              { content: { parts: [{ text: '{"value":"ok"}' }] } },
            ],
          }),
          { status: 200, headers: { "Content-Type": "application/json" } }
        )
      )
    );

    await expect(
      requestAiJsonCompletion({ prompt: "Return JSON", responseSchema })
    ).resolves.toEqual({
      content: '{"value":"ok"}',
      model: "fictional-test-model",
    });
  });

  it("falls back once to Gemini JSON mode when its schema is rejected", async () => {
    stubAiEnvironment("https://generativelanguage.googleapis.com/v1beta/openai");
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            error: { code: 400, status: "INVALID_ARGUMENT" },
          }),
          { status: 400, headers: { "Content-Type": "application/json" } }
        )
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            candidates: [
              { content: { parts: [{ text: '{"value":"ok"}' }] } },
            ],
          }),
          { status: 200, headers: { "Content-Type": "application/json" } }
        )
      );
    vi.stubGlobal("fetch", fetchMock);

    await expect(
      requestAiJsonCompletion({ prompt: "Return JSON", responseSchema })
    ).resolves.toEqual({
      content: '{"value":"ok"}',
      model: "fictional-test-model",
    });

    expect(fetchMock).toHaveBeenCalledTimes(2);
    const fallbackRequest = JSON.parse(
      String(fetchMock.mock.calls[1]?.[1]?.body)
    ) as {
      generationConfig: Record<string, unknown>;
    };
    expect(fallbackRequest.generationConfig.responseMimeType).toBe(
      "application/json"
    );
    expect(fallbackRequest.generationConfig).not.toHaveProperty(
      "responseJsonSchema"
    );
  });

  it("does not hide Gemini authentication failures behind JSON fallback", async () => {
    stubAiEnvironment("https://generativelanguage.googleapis.com/v1beta/openai");
    const fetchMock = vi
      .fn()
      .mockResolvedValue(new Response("Unauthorized", { status: 401 }));
    vi.stubGlobal("fetch", fetchMock);

    await expect(
      requestAiJsonCompletion({ prompt: "Return JSON", responseSchema })
    ).rejects.toMatchObject({
      errorCode: "AI_PROVIDER_AUTH_FAILED",
      providerStatus: 401,
    } satisfies Partial<AiProviderError>);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("normalizes a trailing slash on Gemini's compatible endpoint", async () => {
    stubAiEnvironment(
      "https://generativelanguage.googleapis.com/v1beta/openai/"
    );
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          candidates: [
            { content: { parts: [{ text: '{"value":"ok"}' }] } },
          ],
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      )
    );
    vi.stubGlobal("fetch", fetchMock);

    await requestAiJsonCompletion({ prompt: "Return JSON", responseSchema });

    expect(fetchMock.mock.calls[0]?.[0]).toBe(
      "https://generativelanguage.googleapis.com/v1beta/models/fictional-test-model:generateContent"
    );
  });

  it("keeps schema-less Gemini requests in JSON object mode", async () => {
    stubAiEnvironment("https://generativelanguage.googleapis.com/v1beta/openai");
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({ choices: [{ message: { content: "{}" } }] }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      )
    );
    vi.stubGlobal("fetch", fetchMock);

    await requestAiJsonCompletion({ prompt: "Return JSON" });

    const request = JSON.parse(String(fetchMock.mock.calls[0]?.[1]?.body)) as {
      response_format: unknown;
    };
    expect(request.response_format).toEqual({ type: "json_object" });
  });

  it("classifies an aborted request as a safe retryable timeout", async () => {
    vi.useFakeTimers();
    stubAiEnvironment("https://generativelanguage.googleapis.com/v1beta/openai");
    vi.stubGlobal(
      "fetch",
      vi.fn().mockImplementation((_url: string, init?: RequestInit) =>
        new Promise((_resolve, reject) => {
          init?.signal?.addEventListener("abort", () =>
            reject(new DOMException("Aborted", "AbortError"))
          );
        })
      )
    );

    const pending = requestAiJsonCompletion({
      prompt: "Return JSON",
      responseSchema,
      timeoutMs: 1_000,
    });
    const rejection = expect(pending).rejects.toMatchObject({
      errorCode: "AI_REQUEST_TIMEOUT",
      retryable: true,
    } satisfies Partial<AiProviderError>);
    await vi.advanceTimersByTimeAsync(1_000);
    await rejection;
  });

  it("marks temporary provider HTTP errors as retryable", async () => {
    stubAiEnvironment("https://generativelanguage.googleapis.com/v1beta/openai");
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(new Response("Unavailable", { status: 503 }))
    );

    await expect(
      requestAiJsonCompletion({ prompt: "Return JSON", responseSchema })
    ).rejects.toMatchObject({
      errorCode: "AI_REQUEST_FAILED",
      providerStatus: 503,
      retryable: true,
    } satisfies Partial<AiProviderError>);
  });
});

function stubAiEnvironment(baseUrl: string): void {
  vi.stubEnv("AI_PROVIDER_API_KEY", "fictional-test-key");
  vi.stubEnv("AI_MODEL", "fictional-test-model");
  vi.stubEnv("AI_PROVIDER_BASE_URL", baseUrl);
}
