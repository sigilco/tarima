import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { beforeEach, describe, expect, it } from "vitest";

const dir = mkdtempSync(join(tmpdir(), "tarima-overpass-"));
process.env.DATABASE_URL = join(dir, "test.db");
process.env.TARIMA_PLACE_OVERPASS_BUDGET = "100";

const { db } = await import("../../db");
const { providerCircuit } = await import("../../db/schema");
const { loadFixture } = await import("../place-fixtures");
const { OverpassCircuitOpenError, parseOverpassElements, searchOverpass, overpassCircuitState } =
  await import("./overpass");

const food = loadFixture("osm/01-food-amenities.json") as {
  elements: Array<{
    type: string;
    id: number;
    lat?: number;
    lon?: number;
    tags?: Record<string, string>;
  }>;
};
const closed = loadFixture("osm/10-closed-disused.json") as {
  elements: typeof food.elements;
};

describe("overpass", () => {
  beforeEach(() => {
    db.delete(providerCircuit).run();
  });

  it("parses OSM fixtures, drops disused rows, and keeps named venues", () => {
    const live = parseOverpassElements(food.elements, "Berkeley");
    expect(live.length).toBeGreaterThan(10);
    expect(live.some((h) => h.name === "Triple Rock Brewery")).toBe(true);
    const dead = parseOverpassElements(closed.elements, "Berkeley");
    expect(dead.every((h) => !h.externalId.includes("disused"))).toBe(true);
    expect(dead.length).toBe(0);
  });

  it("opens the circuit after repeated 502s", async () => {
    const fetch502: typeof fetch = async () => new Response("server at capacity", { status: 502 });
    const center = { lat: 37.8719, lon: -122.2585, city: "Berkeley" };
    for (let i = 0; i < 3; i++) {
      await expect(
        searchOverpass({
          center,
          radiusM: 1500,
          fetch: fetch502,
          timeoutMs: 200,
        }),
      ).rejects.toThrow();
    }
    expect(overpassCircuitState().state).toBe("open");
    await expect(
      searchOverpass({ center, radiusM: 1500, fetch: fetch502, timeoutMs: 200 }),
    ).rejects.toBeInstanceOf(OverpassCircuitOpenError);
  });
});
