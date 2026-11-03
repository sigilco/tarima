/**
 * Overpass adapter (overpass-api.de): the enrichment provider.
 *
 * Discovery is Photon's job. Overpass answers one question per venue:
 * what does OSM know about this osm id? The tags that can carry a
 * contact (`contact:email`, `contact:phone`, `website`, `phone`) plus
 * `capacity` and `opening_hours` are read from the response.
 *
 * The public instance is regularly at capacity and self-documents as
 * not-for-automation, so the adapter:
 *   - times out fast (the beta cannot wait minutes for a contact),
 *   - retries with exponential backoff on 429/502/503/504,
 *   - never bulk-queries: one osm id per request.
 *
 * Honesty rule: no tag means no contact. Nothing is guessed.
 */
import type { FetchImpl, OsmId, VenueDetails, VenueEnrichProvider } from "./types";

/** The public Overpass endpoint. */
export const OVERPASS_BASE_URL = "https://overpass-api.de/api/interpreter";

/** Request timeout in ms (default 15s: the public instance is slow). */
const DEFAULT_TIMEOUT_MS = 15_000;

/** Retries after the first attempt. */
const DEFAULT_RETRIES = 2;

/** The base backoff between retries, doubled per attempt. */
const DEFAULT_BACKOFF_MS = 500;

/** The status codes that mean "come back later". */
const RETRYABLE = new Set([429, 502, 503, 504]);

export interface OverpassOptions {
  /** The fetch to use. Defaults to the global one. */
  fetchImpl?: FetchImpl;
  /** The endpoint. Overridable so a local Overpass can serve it. */
  baseUrl?: string;
  timeoutMs?: number;
  retries?: number;
  backoffMs?: number;
  /** Injectable sleep, so the backoff tests do not wait. */
  sleep?: (ms: number) => Promise<void>;
}

/**
 * The Overpass QL query for one osm id.
 *
 * The osm id is the provider identity in the form `<type>/<id>` (e.g.
 * `node/9684320117`). Overpass wants the type and the id as separate
 * selectors, so the form is `node(id:9684320117)`.
 */
export function overpassQuery(osmId: OsmId): string {
  const [type, id] = osmId.split("/");
  if (!type || !id) return `[out:json][timeout:25];(id:${osmId};);out body tags;`;
  return `[out:json][timeout:25];(${type}(id:${id}););out body tags;`;
}

/** The tags of one element, as a flat record. */
type Tags = Record<string, string>;

interface OverpassElement {
  type?: string;
  id?: number | string;
  tags?: Tags;
}

interface OverpassResponse {
  elements?: OverpassElement[];
}

/** The first non-empty value of the listed tag keys. */
function tagValue(tags: Tags, keys: string[]): string | undefined {
  for (const key of keys) {
    const value = tags[key]?.trim();
    if (value) return value;
  }
  return undefined;
}

/**
 * Map an Overpass response to the contact details of one venue.
 *
 * Every field is optional: OSM rarely carries all of them, and a
 * missing tag must stay missing.
 */
export function overpassToDetails(payload: OverpassResponse, osmId: OsmId): VenueDetails {
  const element = (payload.elements ?? [])[0];
  const tags = element?.tags ?? {};
  const email = tagValue(tags, ["contact:email", "email"]);
  const phone = tagValue(tags, ["contact:phone", "phone"]);
  const website = tagValue(tags, ["website", "contact:website", "url"]);
  const hours = tagValue(tags, ["opening_hours"]);
  const capacityRaw = tagValue(tags, ["capacity"]);
  const capacity = capacityRaw ? Number.parseInt(capacityRaw, 10) : Number.NaN;
  return {
    externalId: osmId,
    ...(email ? { contactEmail: email } : {}),
    ...(phone ? { contactPhone: phone } : {}),
    ...(website ? { website } : {}),
    ...(Number.isFinite(capacity) && capacity > 0 ? { capacity } : {}),
    ...(hours ? { openingHours: hours } : {}),
  };
}

/** The Overpass enrichment provider. */
export function overpassProvider(options: OverpassOptions = {}): VenueEnrichProvider {
  const fetchImpl = options.fetchImpl ?? ((url, init) => globalThis.fetch(url, init));
  const baseUrl = options.baseUrl ?? OVERPASS_BASE_URL;
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const retries = options.retries ?? DEFAULT_RETRIES;
  const backoffMs = options.backoffMs ?? DEFAULT_BACKOFF_MS;
  const sleep = options.sleep ?? ((ms: number) => new Promise((r) => setTimeout(r, ms)));

  /** A response error the caller should not retry (a non-retryable status). */
  class HttpError extends Error {
    constructor(readonly status: number) {
      super(`overpass responded ${status}`);
    }
  }

  return {
    id: "overpass",
    async search(): Promise<never> {
      // Overpass is enrichment only: discovery belongs to Photon.
      throw new Error("the overpass provider does not search, it enriches");
    },
    async enrich(osmId: OsmId): Promise<VenueDetails> {
      let lastError: unknown;
      for (let attempt = 0; attempt <= retries; attempt++) {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), timeoutMs);
        try {
          const res = await fetchImpl(
            `${baseUrl}?data=${encodeURIComponent(overpassQuery(osmId))}`,
            {
              signal: controller.signal,
            },
          );
          if (!res.ok) {
            // A status the instance will not fix by waiting (a malformed
            // query, a forbidden id) is final: do not retry it.
            if (!RETRYABLE.has(res.status)) throw new HttpError(res.status);
            if (attempt === retries) throw new HttpError(res.status);
            lastError = new HttpError(res.status);
            await sleep(backoffMs * 2 ** attempt);
            continue;
          }
          const payload = (await res.json()) as OverpassResponse;
          return overpassToDetails(payload, osmId);
        } catch (err) {
          lastError = err;
          if (err instanceof HttpError && !RETRYABLE.has(err.status)) throw err;
          if (attempt === retries) break;
          await sleep(backoffMs * 2 ** attempt);
        } finally {
          clearTimeout(timer);
        }
      }
      throw lastError instanceof Error ? lastError : new Error("overpass enrichment failed");
    },
  };
}
