import { describe, expect, it } from "vitest";
import { fixtureFetch } from "@tarima/api/services/place-fixtures";
import { setVenueSearchDeps } from "@tarima/api/services/venue-search";
import searchVenues from "./search_venues";

const ctxFor = (userId: string | null) => ({
  session: { auth: { current: userId ? { principalId: userId } : null } },
});

const noSleep = () => Promise.resolve();

describe("search_venues tool", () => {
  it("rejects an unauthenticated caller", async () => {
    const out = (await searchVenues.execute({ city: "Berkeley" }, ctxFor(null) as never)) as {
      error?: string;
    };
    expect(out.error).toBe("unauthorized");
  });

  it("looks for venues near UC Berkeley and hits the cache on repeat", async () => {
    const first = fixtureFetch();
    setVenueSearchDeps({
      fetch: first.fetch,
      geoapifyKey: "test-fixture-key",
      env: {},
      sleep: noSleep,
    });
    const miss = (await searchVenues.execute(
      { city: "Berkeley", query: "look for venues near UC Berkeley", category: "food" },
      ctxFor("u-search") as never,
    )) as { cache: string; venues: Array<{ distanceM?: number; name: string }> };
    expect(miss.cache).toBe("miss");
    expect(miss.venues.length).toBeGreaterThan(0);
    expect(miss.venues[0].distanceM).toBeGreaterThanOrEqual(0);

    const second = fixtureFetch();
    setVenueSearchDeps({
      fetch: second.fetch,
      geoapifyKey: "test-fixture-key",
      env: {},
      sleep: noSleep,
    });
    const hit = (await searchVenues.execute(
      { city: "Berkeley", query: "look for venues near UC Berkeley", category: "food" },
      ctxFor("u-search") as never,
    )) as { cache: string; venues: unknown[] };
    expect(hit.cache).toBe("hit");
    expect(second.calls).toHaveLength(0);
  });
});
