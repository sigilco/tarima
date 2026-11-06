import { defineTool } from "eve/tools";
import { z } from "zod";
import { callerUserId } from "../lib/tarima";
import { searchSponsors } from "@tarima/api/services/sponsor-search";

/**
 * Sponsor/company discovery (Phase 4): one cauce `/api/search` call,
 * RRF-fused and domain-deduped. Read-only — never prompts.
 *
 * Results are POINTERS to official sites, not contacts: the honest-
 * contact rule means a SERP snippet never becomes an email or phone.
 * To turn a sponsor into a board row, follow up with `add_candidate`.
 */
export default defineTool({
  description:
    "Search the web for companies or sponsors matching a description (e.g. 'AI companies that sponsor Berkeley tech meetups'). Returns ranked candidates with official-site URLs. Read-only.",
  inputSchema: z.object({
    query: z.string().min(1).describe("What to look for, in plain words."),
    limit: z.number().int().min(1).max(25).optional().describe("Max candidates (default 10)."),
  }),
  async execute(input, ctx) {
    if (!callerUserId(ctx)) return { error: "unauthorized" };
    const res = await searchSponsors(input.query, { limit: input.limit });
    if (!res.ok) return { error: res.reason };
    return {
      query: res.query,
      sponsors: res.sponsors.map((s) => ({
        name: s.title,
        url: s.url,
        domain: s.domain,
        snippet: s.snippet,
      })),
      note: "These are web results pointing at official sites — not verified contacts. Confirm details on the site or via add_candidate + outreach.",
    };
  },
});
