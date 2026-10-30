/**
 * Photon adapter tests: pure, over recorded fixtures. The fetch is a
 * stub, so no test touches the network.
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { photonProvider, photonToCandidates, photonUrl } from "./photon";
import type { FetchImpl } from "./types";

function fixture(name: string): string {
  return readFileSync(fileURLToPath(new URL(`../fixtures/${name}`, import.meta.url)), "utf8");
}

/** A fetch that answers with a recorded fixture and counts the calls. */
function stubFetch(name: string): FetchImpl & { calls: string[] } {
  const body = fixture(name);
  const calls: string[] = [];
  const impl = (async (url: string) => {
    calls.push(url);
    return new Response(body, { status: 200, headers: { "content-type": "application/json" } });
  }) as FetchImpl & { calls: string[] };
  impl.calls = calls;
  return impl;
}

describe("photon url", () => {
  it("maps a bare city name to its bbox", () => {
    const url = new URL(photonUrl({ city: "sf", category: "bar" }));
    expect(url.searchParams.get("bbox")).toBe("-122.51,37.7,-122.35,37.82");
    expect(url.searchParams.get("osm_tag")).toBe("amenity:bar");
  });

  it("maps the accented city name to the same bbox", () => {
    const url = new URL(photonUrl({ city: "Málaga", category: "cafe" }));
    expect(url.searchParams.get("bbox")).toBe("-4.43,36.69,-4.4,36.73");
  });

  it("prefers an explicit bbox over the preset", () => {
    const url = new URL(photonUrl({ city: "sf", category: "bar", bbox: [1, 2, 3, 4] }));
    expect(url.searchParams.get("bbox")).toBe("1,2,3,4");
  });

  it("omits the bbox for an unknown city", () => {
    const url = new URL(photonUrl({ city: "Berlin", category: "bar" }));
    expect(url.searchParams.get("bbox")).toBeNull();
  });

  it("caps the limit", () => {
    const url = new URL(photonUrl({ city: "sf", category: "bar", limit: 500 }));
    expect(url.searchParams.get("limit")).toBe("25");
  });
});

describe("photon response mapping", () => {
  it("maps the recorded SF fixture to candidates", () => {
    const payload = JSON.parse(fixture("photon-sf.json"));
    const candidates = photonToCandidates(payload, { city: "sf", category: "bar" });
    expect(candidates.length).toBeGreaterThan(0);
    expect(candidates[0]!.name).toBe("Bar Part Time");
    expect(candidates[0]!.externalId).toMatch(/^[a-z]+\/\d+$/);
    expect(candidates[0]!.lat).toBeGreaterThan(37);
    expect(candidates[0]!.lon).toBeLessThan(-122);
  });

  it("drops a feature without a name or an osm id", () => {
    const candidates = photonToCandidates(
      {
        features: [
          { properties: { name: "No id" }, geometry: { coordinates: [1, 2] } },
          { properties: { osm_type: "N", osm_id: 1 }, geometry: { coordinates: [1, 2] } },
        ],
      },
      { city: "sf", category: "bar" },
    );
    expect(candidates).toHaveLength(0);
  });

  it("never invents a contact", () => {
    const payload = JSON.parse(fixture("photon-sf.json"));
    for (const candidate of photonToCandidates(payload, { city: "sf", category: "bar" })) {
      expect("contactEmail" in candidate).toBe(false);
      expect("contactPhone" in candidate).toBe(false);
    }
  });
});

describe("photon provider", () => {
  it("searches with the injected fetch and no network", async () => {
    const fetchImpl = stubFetch("photon-malaga.json");
    const provider = photonProvider({ fetchImpl });
    const candidates = await provider.search({ city: "malaga", category: "bar" });
    expect(candidates.length).toBeGreaterThan(0);
    expect(fetchImpl.calls).toHaveLength(1);
    expect(fetchImpl.calls[0]).toContain("photon");
  });

  it("throws on a provider error", async () => {
    const failing: FetchImpl = async () => new Response("nope", { status: 503 });
    const provider = photonProvider({ fetchImpl: failing });
    await expect(provider.search({ city: "sf", category: "bar" })).rejects.toThrow(/503/);
  });
});
