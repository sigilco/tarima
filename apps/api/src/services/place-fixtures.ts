import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import type { InjectedFetch } from "./providers/types";

const here = dirname(fileURLToPath(import.meta.url));
export const FIXTURE_ROOT = resolve(here, "../../../../docs/handoff/context/fixtures");

export function loadFixture(rel: string): unknown {
  return JSON.parse(readFileSync(resolve(FIXTURE_ROOT, rel), "utf8"));
}

export type FixtureFetchOptions = {
  overpassStatus?: number;
  overpassBody?: unknown;
};

/** Replay recorded Berkeley Photon / Geoapify / Overpass responses. */
export function fixtureFetch(opts: FixtureFetchOptions = {}): {
  fetch: InjectedFetch;
  calls: string[];
} {
  const calls: string[] = [];
  const photon = loadFixture("osm/00-photon-geocode.json");
  const places = loadFixture("geoapify/places-berkeley.json");
  const geocode = loadFixture("geoapify/geocode-ucb.json");
  const food = loadFixture("osm/01-food-amenities.json");
  const fetchImpl: InjectedFetch = async (input, init) => {
    const url = String(input);
    calls.push(`${init?.method ?? "GET"} ${url}`);
    const json = (body: unknown, status = 200) =>
      new Response(JSON.stringify(body), {
        status,
        headers: { "Content-Type": "application/json" },
      });
    if (url.includes("photon.komoot.io")) return json(photon);
    if (url.includes("geoapify.com/v1/geocode")) return json(geocode);
    if (url.includes("geoapify.com/v2/places")) return json(places);
    if (url.includes("overpass-api.de") || url.includes("overpass")) {
      if (opts.overpassStatus && opts.overpassStatus !== 200) {
        return new Response("server at capacity", { status: opts.overpassStatus });
      }
      return json(opts.overpassBody ?? food);
    }
    throw new Error(`unexpected fetch: ${url}`);
  };
  return { fetch: fetchImpl, calls };
}
