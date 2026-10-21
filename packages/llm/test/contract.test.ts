import { describe, expect, it } from "vitest";
import { createLLM } from "../src/provider";
import type { LlmProvider } from "../src/types";

/**
 * Structural compatibility check. `ChaseLlm` in @tarima/chase is mirrored
 * here on purpose: this package must never import chase (chase depends on
 * this interface at wiring time, so the import would be a cycle). The
 * mirror is kept in sync by hand; TypeScript checks assignability, which is
 * the property that matters at the wiring site.
 */
interface ChaseLlmShape {
  draftOutreach(input: {
    entityName: string;
    goal: Record<string, unknown>;
    isFollowUp: boolean;
    followUpNumber?: number;
  }): Promise<{ subject: string; body: string }>;
  parseReply(
    body: string,
    goal: Record<string, unknown>,
  ): Promise<{ answered: boolean; fields: Record<string, unknown>; confidence: number }>;
}

describe("structural compatibility with the chase seam", () => {
  it("an LlmProvider is assignable to the ChaseLlm shape", () => {
    const provider: LlmProvider = createLLM({
      baseUrl: "http://llm.test/v1",
      apiKey: "key",
      instructModelId: "i",
      thinkingModelId: "t",
    });
    const chaseLlm: ChaseLlmShape = provider;
    expect(typeof chaseLlm.draftOutreach).toBe("function");
    expect(typeof chaseLlm.parseReply).toBe("function");
  });
});
