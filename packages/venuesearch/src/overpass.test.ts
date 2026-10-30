/**
 * Overpass adapter tests: pure, over a stubbed fetch. No network.
 */
import { describe, expect, it } from "vitest";
import { overpassProvider, overpassQuery, overpassToDetails } from "./overpass";
import type { FetchImpl } from "./types";

const NODE_TAGS = {
  amenity: "bar",
  name: "Bar Cervantes",
  "contact:email": "hola@barcervantes.es",
  "contact:phone": "+34 951 00 00 00",
  website: "https://barcervantes.es",
  capacity: "80",
  opening_hours: "Mo-Su 18:00-02:00",
};

describe("overpass query", () => {
  it("targets one osm id", () => {
    expect(overpassQuery("node/2766723153")).toContain("[out:json]");
    // The provider identity splits into an Overpass type selector.
    expect(overpassQuery("node/2766723153")).toContain("node(id:2766723153)");
  });

  it("keeps a junk id inside the query instead of throwing", () => {
    expect(overpassQuery("junk")).toContain("[out:json]");
  });
});

describe("overpass detail mapping", () => {
  it("reads the contact tags from the first element", () => {
    const details = overpassToDetails(
      { elements: [{ type: "node", id: 1, tags: NODE_TAGS }] },
      "node/1",
    );
    expect(details.contactEmail).toBe("hola@barcervantes.es");
    expect(details.contactPhone).toBe("+34 951 00 00 00");
    expect(details.website).toBe("https://barcervantes.es");
    expect(details.capacity).toBe(80);
    expect(details.openingHours).toBe("Mo-Su 18:00-02:00");
  });

  it("falls back to the bare tag names", () => {
    const details = overpassToDetails(
      { elements: [{ tags: { email: "a@b.test", phone: "123", url: "https://x.test" } }] },
      "node/1",
    );
    expect(details.contactEmail).toBe("a@b.test");
    expect(details.contactPhone).toBe("123");
    expect(details.website).toBe("https://x.test");
  });

  it("leaves a field absent when OSM has no tag for it", () => {
    const details = overpassToDetails(
      { elements: [{ tags: { name: "no contact bar" } }] },
      "node/1",
    );
    expect(details.contactEmail).toBeUndefined();
    expect(details.contactPhone).toBeUndefined();
    expect(details.website).toBeUndefined();
    expect(details.capacity).toBeUndefined();
  });

  it("ignores a junk capacity", () => {
    const details = overpassToDetails({ elements: [{ tags: { capacity: "many" } }] }, "node/1");
    expect(details.capacity).toBeUndefined();
  });

  it("answers with an all-absent detail for an unknown id", () => {
    const details = overpassToDetails({ elements: [] }, "way/404");
    expect(details).toEqual({ externalId: "way/404" });
  });
});

describe("overpass provider", () => {
  it("retries a retryable status with backoff and succeeds", async () => {
    const sleeps: number[] = [];
    let calls = 0;
    const fetchImpl: FetchImpl = async () => {
      calls++;
      if (calls === 1) return new Response("at capacity", { status: 502 });
      return new Response(JSON.stringify({ elements: [{ tags: NODE_TAGS }] }), { status: 200 });
    };
    const provider = overpassProvider({
      fetchImpl,
      retries: 2,
      sleep: async (ms) => {
        sleeps.push(ms);
      },
    });
    const details = await provider.enrich("node/1");
    expect(calls).toBe(2);
    expect(details.contactEmail).toBe("hola@barcervantes.es");
    expect(sleeps).toEqual([500]);
  });

  it("exhausts the retries on a persistent 502", async () => {
    const fetchImpl: FetchImpl = async () => new Response("at capacity", { status: 502 });
    const provider = overpassProvider({ fetchImpl, retries: 1, sleep: async () => {} });
    await expect(provider.enrich("node/1")).rejects.toThrow(/502/);
  });

  it("does not retry a non-retryable status", async () => {
    let calls = 0;
    const fetchImpl: FetchImpl = async () => {
      calls++;
      return new Response("bad request", { status: 400 });
    };
    const provider = overpassProvider({ fetchImpl, retries: 3, sleep: async () => {} });
    await expect(provider.enrich("node/1")).rejects.toThrow(/400/);
    expect(calls).toBe(1);
  });

  it("refuses to search: discovery is Photon's job", async () => {
    const provider = overpassProvider({
      fetchImpl: async () => new Response("{}", { status: 200 }),
    });
    await expect(provider.search({ city: "sf", category: "bar" })).rejects.toThrow(/search/);
  });
});
