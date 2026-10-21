/**
 * Minimal OpenAI-compatible chat completions client. One POST to
 * {base}/chat/completions with optional JSON mode. This exists because the
 * Vercel AI SDK hard-requires zod as a peer dependency (and its structured
 * output rejects valibot schemas), while this repo is valibot-only.
 */

interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

interface ChatCompletionRequest {
  model: string;
  messages: ChatMessage[];
  /** Ask the endpoint for a JSON object response (`response_format`). */
  json?: boolean;
  temperature?: number;
}

interface ChatCompletionResponse {
  content: string;
  /** Raw response body, for debugging and error paths. */
  raw: unknown;
}

export interface OpenAiCompatibleClient {
  complete(req: ChatCompletionRequest): Promise<ChatCompletionResponse>;
}

export interface OpenAiCompatibleConfig {
  baseUrl: string;
  apiKey: string;
  /** Injectable for tests. Defaults to global fetch. */
  fetchImpl?: typeof fetch;
  /** Request timeout. Defaults to 60s. */
  timeoutMs?: number;
}

/** Extract the assistant text from an OpenAI-style response body. */
function extractContent(body: unknown): string {
  const choices = (body as { choices?: Array<{ message?: { content?: unknown } }> })?.choices;
  const content = choices?.[0]?.message?.content;
  if (typeof content === "string") return content;
  // Some gateways return content as an array of parts.
  if (Array.isArray(content)) {
    return content
      .map((part) => (typeof part === "string" ? part : ((part as { text?: string })?.text ?? "")))
      .join("");
  }
  return "";
}

export function createOpenAiCompatible(config: OpenAiCompatibleConfig): OpenAiCompatibleClient {
  const base = config.baseUrl.replace(/\/+$/, "");
  return {
    async complete(req: ChatCompletionRequest): Promise<ChatCompletionResponse> {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), config.timeoutMs ?? 60_000);
      let res: Response;
      try {
        res = await (config.fetchImpl ?? fetch)(`${base}/chat/completions`, {
          method: "POST",
          signal: controller.signal,
          headers: {
            authorization: `Bearer ${config.apiKey}`,
            "content-type": "application/json",
          },
          body: JSON.stringify({
            model: req.model,
            messages: req.messages,
            ...(req.json ? { response_format: { type: "json_object" } } : {}),
            ...(req.temperature !== undefined ? { temperature: req.temperature } : {}),
          }),
        });
      } finally {
        clearTimeout(timer);
      }
      const text = await res.text();
      let body: unknown;
      try {
        body = JSON.parse(text);
      } catch {
        body = text;
      }
      if (!res.ok) {
        throw new Error(
          `llm request failed: ${res.status} ${typeof body === "string" ? body : JSON.stringify(body).slice(0, 500)}`,
        );
      }
      return { content: extractContent(body), raw: body };
    },
  };
}
