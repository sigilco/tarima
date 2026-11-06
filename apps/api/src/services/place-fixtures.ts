import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import type { InjectedFetch } from "./providers/types";

const here = dirname(fileURLToPath(import.meta.url));
export const FIXTURE_ROOT = resolve(here, "../../../../docs/handoff/context/fixtures");
const ENRICH_FIXTURES = resolve(here, "fixtures/enrich");

export function loadFixture(rel: string): unknown {
  return JSON.parse(readFileSync(resolve(FIXTURE_ROOT, rel), "utf8"));
}

export type FixtureFetchOptions = {
  overpassStatus?: number;
  overpassBody?: unknown;
  /** Geoapify places body override (thin-result escalation tests). */
  geoapifyPlacesBody?: unknown;
  /** Google Places searchText body override. */
  googlePlacesBody?: unknown;
  /** Foursquare /places/search body override ({ results: [...] }). */
  fsqSearchBody?: unknown;
  /** Foursquare /places/{id} details body override. */
  fsqDetailsBody?: unknown;
  /** Markdown returned by the cauce /api/pages replay endpoint. */
  cauceMarkdown?: string;
  /** robots.txt body for venue-site crawls (default: allow all). */
  robotsTxt?: string;
};

/**
 * Replay recorded Berkeley Photon / Geoapify / Overpass responses plus
 * the tier-2/3 wire paths: venue robots.txt, the cauce /api/pages
 * fetch-and-index endpoint, Google Places and Foursquare. Any URL that
 * is not one of those throws `unexpected fetch` so tests stay honest.
 */
export function fixtureFetch(opts: FixtureFetchOptions = {}): {
  fetch: InjectedFetch;
  calls: string[];
} {
  const calls: string[] = [];
  const photon = loadFixture("osm/00-photon-geocode.json");
  const places = opts.geoapifyPlacesBody ?? loadFixture("geoapify/places-berkeley.json");
  const geocode = loadFixture("geoapify/geocode-ucb.json");
  const food = loadFixture("osm/01-food-amenities.json");
  const cauceMarkdown =
    opts.cauceMarkdown ??
    readFileSync(resolve(ENRICH_FIXTURES, "cauce-markdown-contact.md"), "utf8");
  const robotsTxt = opts.robotsTxt ?? "User-agent: *\nAllow: /\n";
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
    // Paid escalation providers (never called unless enabled + thin).
    if (url.includes("places.googleapis.com")) {
      return json(
        opts.googlePlacesBody ?? {
          places: [
            {
              id: "ChIJberkeleytest",
              displayName: { text: "Fixture Google Venue" },
              location: { latitude: 37.8719, longitude: -122.2585 },
              formattedAddress: "Berkeley, CA",
              types: ["restaurant"],
            },
          ],
        },
      );
    }
    if (url.includes("places-api.foursquare.com/places/search")) {
      return json(
        opts.fsqSearchBody ?? {
          results: [
            {
              fsq_place_id: "fsqfixture001",
              name: "Fixture FSQ Venue",
              latitude: 37.872,
              longitude: -122.259,
              location: { formatted_address: "1 Fixture Way, Berkeley, CA" },
              tel: "+15105550199",
              website: "https://fsq-fixture.example",
              rating: 4.2,
            },
          ],
        },
      );
    }
    if (url.includes("places-api.foursquare.com/places/")) {
      return json(
        opts.fsqDetailsBody ?? {
          fsq_place_id: "fsqfixture001",
          name: "Fixture FSQ Venue",
          latitude: 37.872,
          longitude: -122.259,
          tel: "+15105550199",
          website: "https://fsq-fixture.example",
        },
      );
    }
    // Tier-2 crawl: venue robots.txt then cauce fetch-and-index.
    if (url.endsWith("/robots.txt")) {
      return new Response(robotsTxt, {
        status: 200,
        headers: { "Content-Type": "text/plain" },
      });
    }
    if (url.includes("/api/pages") && (init?.method ?? "GET") === "POST") {
      return new Response(
        JSON.stringify({
          url,
          fetched_at: new Date().toISOString(),
          title: "Fixture Venue",
          markdown: cauceMarkdown,
          byte_len: cauceMarkdown.length,
        }),
        { status: 201, headers: { "Content-Type": "application/json" } },
      );
    }
    throw new Error(`unexpected fetch: ${url}`);
  };
  return { fetch: fetchImpl, calls };
}
