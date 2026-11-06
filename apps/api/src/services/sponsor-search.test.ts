import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { domainOf, rankSponsors, searchSponsors } from "./sponsor-search";

const FIXTURE = JSON.parse(
  readFileSync(join(import.meta.dirname, "fixtures", "cauce-search-sponsors.json"), "utf8"),
) as { results: unknown[] };

describe("domainOf", () => {
  it("strips www and keeps the last two labels", () => {
    expect(domainOf("https://www.anthropic.com/careers")).toBe("anthropic.com");
    expect(domainOf("https://blog.cohere.com/x")).toBe("cohere.com");
  });
  it("keeps three labels for common second-level ccTLDs", () => {
    expect(domainOf("https://www.theguardian.co.uk/tech")).toBe("theguardian.co.uk");
  });
  it("returns null for unparseable urls", () => {
    expect(domainOf("not a url")).toBeNull();
  });
});

describe("rankSponsors", () => {
  it("dedupes by domain keeping the best score", () => {
    const out = rankSponsors(FIXTURE.results as never[], 10);
    const domains = out.map((s) => s.domain);
    expect(new Set(domains).size).toBe(domains.length);
    // anthropic.com appears twice in the fixture; only the top row survives.
    expect(domains.filter((d) => d === "anthropic.com")).toHaveLength(1);
    expect(out[0]!.domain).toBe("anthropic.com");
    expect(out.length).toBeLessThanOrEqual(10);
  });

  it("sorts by score descending", () => {
    const out = rankSponsors(FIXTURE.results as never[], 10);
    for (let i = 1; i < out.length; i++) {
      expect(out[i - 1]!.score).toBeGreaterThanOrEqual(out[i]!.score);
    }
  });
});

describe("searchSponsors", () => {
  it("calls cauce /api/search and returns ranked sponsors", async () => {
    const calls: string[] = [];
    const fetchImpl = (async (url: unknown) => {
      calls.push(String(url));
      return new Response(JSON.stringify(FIXTURE), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }) as typeof fetch;
    const res = await searchSponsors("AI companies that sponsor Berkeley tech meetups", {
      fetch: fetchImpl,
      cauceBase: "http://cauce.test",
    });
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    expect(calls[0]).toContain("/api/search?q=");
    expect(res.sponsors.length).toBeGreaterThan(3);
    expect(res.sponsors[0]!.domain).toBe("anthropic.com");
  });

  it("returns http_error on non-OK cauce responses", async () => {
    const fetchImpl = (async () => new Response("nope", { status: 503 })) as typeof fetch;
    const res = await searchSponsors("q", { fetch: fetchImpl, cauceBase: "http://x" });
    expect(res).toEqual({ ok: false, reason: "http_error", status: 503 });
  });

  it("returns bad_response on invalid JSON", async () => {
    const fetchImpl = (async () => new Response("<html>", { status: 200 })) as typeof fetch;
    const res = await searchSponsors("q", { fetch: fetchImpl, cauceBase: "http://x" });
    expect(res).toEqual({ ok: false, reason: "bad_response" });
  });
});
