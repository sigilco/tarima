/**
 * search_sponsors: read-only tool over the cauce /api/search seam.
 * The cauce call is exercised against a loopback stub server (offline);
 * ranking/dedup itself is covered in apps/api sponsor-search.test.ts.
 */
import { createServer, type Server } from "node:http";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import searchSponsors from "./search_sponsors";

const OWNER = "u-ss-owner";

const ctxFor = (userId: string | null) => ({
  session: { auth: { current: userId ? { principalId: userId } : null } },
});

const FIXTURE = {
  query: "AI sponsors Berkeley",
  results: [
    {
      url: "https://www.anthropic.com/",
      title: "Anthropic",
      snippet: "AI safety company",
      engine: "brave",
      score: 0.03,
    },
    {
      url: "https://www.anthropic.com/careers",
      title: "Anthropic Careers",
      snippet: "Join us",
      engine: "bing",
      score: 0.02,
    },
    {
      url: "https://openai.com/",
      title: "OpenAI",
      snippet: "AGI benefits humanity",
      engine: "brave",
      score: 0.025,
    },
  ],
  meta: { request_id: "t", source: "network", engines_used: [] },
};

let server: Server;
let base = "";
let sawQuery = "";

beforeAll(async () => {
  server = createServer((req, res) => {
    const u = new URL(req.url ?? "/", "http://x");
    if (u.pathname === "/api/search") {
      sawQuery = u.searchParams.get("q") ?? "";
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify(FIXTURE));
      return;
    }
    res.writeHead(404).end();
  });
  await new Promise<void>((r) => server.listen(0, "127.0.0.1", r));
  const addr = server.address();
  if (addr && typeof addr === "object") base = `http://127.0.0.1:${addr.port}`;
  process.env.CAUCE_BASE_URL = base;
});

afterAll(async () => {
  delete process.env.CAUCE_BASE_URL;
  await new Promise<void>((r) => server.close(() => r()));
});

describe("search_sponsors", () => {
  it("rejects unauthenticated calls", async () => {
    const res = (await searchSponsors.execute({ query: "AI sponsors" }, ctxFor(null) as never)) as {
      error?: string;
    };
    expect(res.error).toBe("unauthorized");
  });

  it("returns domain-deduped ranked sponsors from cauce", async () => {
    const res = (await searchSponsors.execute(
      { query: "AI sponsors Berkeley", limit: 5 },
      ctxFor(OWNER) as never,
    )) as {
      query: string;
      sponsors: { name: string; domain: string; url: string }[];
      note?: string;
    };
    expect(res.query).toBe("AI sponsors Berkeley");
    expect(sawQuery).toBe("AI sponsors Berkeley");
    const domains = res.sponsors.map((s) => s.domain);
    expect(new Set(domains).size).toBe(domains.length);
    expect(domains).toContain("anthropic.com");
    expect(domains).toContain("openai.com");
    expect(res.note).toContain("not verified contacts");
  });
});
