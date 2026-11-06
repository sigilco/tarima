import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const dir = mkdtempSync(join(tmpdir(), "tarima-warm-"));
process.env.DATABASE_URL = join(dir, "test.db");
process.env.TARIMA_PLACE_CACHE_WARM = "0";

const { warmPlaceCache } = await import("./cache-warm");
const { fixtureFetch } = await import("./place-fixtures");
const { setVenueSearchDeps } = await import("./venue-search");

describe("cache warm", () => {
  it("is off by default", async () => {
    process.env.TARIMA_PLACE_CACHE_WARM = "0";
    const out = await warmPlaceCache();
    expect(out).toEqual({ ran: false, warmed: 0 });
  });

  it("seeds the grid when the flag is on", async () => {
    process.env.TARIMA_PLACE_CACHE_WARM = "1";
    const { fetch } = fixtureFetch();
    setVenueSearchDeps({
      fetch,
      geoapifyKey: "test-fixture-key",
      env: {},
      sleep: () => Promise.resolve(),
    });
    const out = await warmPlaceCache([
      {
        city: "Berkeley",
        query: "UC Berkeley",
        category: "food",
        lat: 37.8719,
        lon: -122.2585,
      },
    ]);
    expect(out.ran).toBe(true);
    expect(out.warmed).toBe(1);
  });
});
