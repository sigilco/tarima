import { describe, expect, it } from "vitest";
import { createLLM } from "../src/provider";

/** Stub fetch that answers chat completions with a fixed content string. */
function stubFetch(content: string): {
  fetchImpl: typeof fetch;
  calls: Array<{ url: string; body: any }>;
} {
  const calls: Array<{ url: string; body: any }> = [];
  const fetchImpl = (async (url: string | URL, init: RequestInit) => {
    const body = JSON.parse(init.body as string);
    calls.push({ url: String(url), body });
    return new Response(
      JSON.stringify({
        choices: [{ message: { role: "assistant", content } }],
      }),
      { status: 200, headers: { "content-type": "application/json" } },
    );
  }) as typeof fetch;
  return { fetchImpl, calls };
}

const ENV = {
  baseUrl: "http://llm.test/v1",
  apiKey: "key",
  instructModelId: "instruct-1",
  thinkingModelId: "thinking-1",
};

describe("createLLM parseReply", () => {
  it("happy path: validates and shapes the extraction", async () => {
    const { fetchImpl, calls } = stubFetch(
      JSON.stringify({ answered: true, fields: { invoice: "sent" }, confidence: 0.9 }),
    );
    const llm = createLLM(ENV, { fetchImpl });
    const parsed = await llm.parseReply("invoice sent yesterday", { invoice: "status" });

    expect(parsed).toEqual({ answered: true, fields: { invoice: "sent" }, confidence: 0.9 });
    expect(calls).toHaveLength(1);
    expect(calls[0]!.url).toBe("http://llm.test/v1/chat/completions");
    expect(calls[0]!.body.model).toBe("instruct-1");
    expect(calls[0]!.body.response_format).toEqual({ type: "json_object" });
    const messages = calls[0]!.body.messages as Array<{ role: string; content: string }>;
    expect(messages[0]!.role).toBe("system");
    expect(messages[1]!.content).toContain("invoice sent yesterday");
    expect(messages[1]!.content).toContain("invoice");
  });

  it("not answered: an out of office reply yields answered=false", async () => {
    const { fetchImpl } = stubFetch(
      JSON.stringify({ answered: false, fields: {}, confidence: 0.2 }),
    );
    const llm = createLLM(ENV, { fetchImpl });
    const parsed = await llm.parseReply("I am on leave until Monday", {});
    expect(parsed.answered).toBe(false);
    expect(parsed.fields).toEqual({});
  });

  it("rejects a model response that is not valid against the schema", async () => {
    const { fetchImpl } = stubFetch(JSON.stringify({ answered: "yes" }));
    const llm = createLLM(ENV, { fetchImpl });
    await expect(llm.parseReply("body", {})).rejects.toThrow();
  });

  it("unwrinks a fenced code block response", async () => {
    const { fetchImpl } = stubFetch('```json\n{"answered":true,"fields":{},"confidence":1}\n```');
    const llm = createLLM(ENV, { fetchImpl });
    const parsed = await llm.parseReply("body", {});
    expect(parsed.answered).toBe(true);
  });
});

describe("createLLM draftOutreach", () => {
  it("uses the thinking model and returns the draft", async () => {
    const { fetchImpl, calls } = stubFetch(
      JSON.stringify({ subject: "Deliverables for Venue X", body: "Hi, we still need the list." }),
    );
    const llm = createLLM(ENV, { fetchImpl });
    const draft = await llm.draftOutreach({
      entityName: "Venue X",
      goal: { deliverables: "list" },
      isFollowUp: false,
    });

    expect(draft).toEqual({
      subject: "Deliverables for Venue X",
      body: "Hi, we still need the list.",
    });
    expect(calls[0]!.body.model).toBe("thinking-1");
    const messages = calls[0]!.body.messages as Array<{ role: string; content: string }>;
    expect(messages[1]!.content).toContain("Venue X");
    expect(messages[1]!.content).toContain("first outreach");
  });

  it("follow-up variant states the follow-up number", async () => {
    const { fetchImpl, calls } = stubFetch(
      JSON.stringify({ subject: "Following up", body: "Circling back." }),
    );
    const llm = createLLM(ENV, { fetchImpl });
    await llm.draftOutreach({
      entityName: "Venue X",
      goal: {},
      isFollowUp: true,
      followUpNumber: 2,
    });
    const messages = calls[0]!.body.messages as Array<{ role: string; content: string }>;
    expect(messages[1]!.content).toContain("follow-up number 2");
  });
});

describe("createLLM configuration errors", () => {
  it("throws when the base url or api key is missing", async () => {
    const llm = createLLM({ ...ENV, baseUrl: "", apiKey: "" });
    await expect(llm.parseReply("body", {})).rejects.toThrow(/LLM_BASE_URL/);
  });

  it("throws when the instruct model is missing", async () => {
    const llm = createLLM(
      { ...ENV, instructModelId: "" },
      {
        fetchImpl: (async () => {
          throw new Error("should not fetch");
        }) as typeof fetch,
      },
    );
    await expect(llm.parseReply("body", {})).rejects.toThrow(/LLM_INSTRUCT_MODEL_ID/);
  });
});

describe("openai-compatible client error handling", () => {
  it("surfaces the http status on a non 2xx response", async () => {
    const fetchImpl = (async () =>
      new Response(JSON.stringify({ error: "quota" }), { status: 429 })) as typeof fetch;
    const llm = createLLM(ENV, { fetchImpl });
    await expect(llm.parseReply("body", {})).rejects.toThrow(/429/);
  });
});
