/**
 * Foursquare Places API (New) — shortlist-only metadata provider.
 *
 * Design source: tarima-search-plan.md tier ladder ("place metadata:
 * FSQ Places details (shortlist only, 500/mo)") and tarima-gmaps.md
 * §1.2 (FSQ repriced June 2026: 500 free Pro calls/mo, then $15 CPM).
 *
 * Rules:
 * - Call ONLY for shortlisted venues that lack contact fields — the
 *   caller decides; this module never searches.
 * - `FSQ_API_KEY` unset → `{ ok:false, reason:"disabled" }`, zero fetch.
 * - App-side daily cap in `provider_ledger` (bucket `details`), Pacific
 *   day, default 16 (= 500/mo ÷ 31 with margin). Override with
 *   `FSQ_PLACES_DAILY_BUDGET`.
 * - Auth is `Authorization: Bearer` + the required
 *   `X-Places-Api-Version: 2025-06-17` header. The key is never placed
 *   in a URL.
 * - Returned fields are ordinary licensed POI data (not Google
 *   content): they MAY be persisted by the caller with
 *   `contact_source='fsq'` provenance. This module itself writes
 *   nothing.
 */
import type { ApiDb } from "../projects";
import { ledgerAdd, ledgerGet } from "./ledger";

export type InjectedFetch = typeof fetch;

const BASE = "https://places-api.foursquare.com";
const API_VERSION = "2025-06-17";
const PROVIDER = "foursquare";
const UA = "tarima-bot/0.1 (+https://tarima.local)";

/** Fields worth paying attention to on the shortlist pass. */
const DETAIL_FIELDS = [
  "fsq_place_id",
  "name",
  "latitude",
  "longitude",
  "location",
  "timezone",
  "hours",
  "tel",
  "website",
  "rating",
  "stats",
  "price",
].join(",");

export interface FsqPlaceDetails {
  fsqPlaceId: string;
  name?: string;
  latitude?: number;
  longitude?: number;
  address?: string;
  timezone?: string;
  /** FSQ hours is an object of day → list of open/close pairs. */
  hours?: Record<string, unknown>;
  phone?: string;
  website?: string;
  rating?: number;
  totalRatings?: number;
  price?: number;
}

export type FsqResult =
  | { ok: true; place: FsqPlaceDetails }
  | {
      ok: false;
      reason: "disabled" | "no_key" | "over_budget" | "http_error" | "not_found" | "bad_response";
      status?: number;
    };

export type FsqSearchResult =
  | { ok: true; places: FsqPlaceDetails[] }
  | {
      ok: false;
      reason: "disabled" | "no_key" | "over_budget" | "http_error" | "bad_response";
      status?: number;
    };

function envInt(env: NodeJS.ProcessEnv, key: string, fallback: number): number {
  const raw = env[key];
  if (raw === undefined || raw === "") return fallback;
  const n = Number.parseInt(raw, 10);
  return Number.isFinite(n) && n >= 0 ? n : fallback;
}

export function fsqDailyBudget(env: NodeJS.ProcessEnv = process.env): number {
  return envInt(env, "FSQ_PLACES_DAILY_BUDGET", 16);
}

function str(v: unknown): string | undefined {
  return typeof v === "string" && v.length > 0 ? v : undefined;
}

function num(v: unknown): number | undefined {
  return typeof v === "number" && Number.isFinite(v) ? v : undefined;
}

function parseDetails(raw: Record<string, unknown>): FsqPlaceDetails | null {
  const fsqPlaceId = str(raw.fsq_place_id);
  if (!fsqPlaceId) return null;
  const loc = raw.location as Record<string, unknown> | undefined;
  const stats = raw.stats as Record<string, unknown> | undefined;
  const place: FsqPlaceDetails = { fsqPlaceId };
  const name = str(raw.name);
  if (name) place.name = name;
  const lat = num(raw.latitude);
  const lon = num(raw.longitude);
  if (lat !== undefined) place.latitude = lat;
  if (lon !== undefined) place.longitude = lon;
  const addr = str(loc?.formatted_address) ?? str(loc?.address);
  if (addr) place.address = addr;
  const tz = str(raw.timezone);
  if (tz) place.timezone = tz;
  if (raw.hours && typeof raw.hours === "object") {
    place.hours = raw.hours as Record<string, unknown>;
  }
  const tel = str(raw.tel);
  if (tel) place.phone = tel;
  const web = str(raw.website);
  if (web) place.website = web;
  const rating = num(raw.rating);
  if (rating !== undefined) place.rating = rating;
  const total = num(stats?.total_ratings);
  if (total !== undefined) place.totalRatings = total;
  const price = num(raw.price);
  if (price !== undefined) place.price = price;
  return place;
}

/**
 * GET /places/{fsq_place_id}?fields=… — one billed Pro call.
 * `fsqPlaceId` comes from a prior FSQ search or a stored
 * `external_id` with the `fsq:` prefix.
 */
export async function placeDetails(
  db: ApiDb,
  fsqPlaceId: string,
  deps: { fetch?: InjectedFetch; env?: NodeJS.ProcessEnv; now?: Date } = {},
): Promise<FsqResult> {
  const env = deps.env ?? process.env;
  const apiKey = env.FSQ_API_KEY;
  if (!apiKey) return { ok: false, reason: env.FSQ_API_KEY === undefined ? "disabled" : "no_key" };

  const now = deps.now ?? new Date();
  // Search and details share ONE daily cap (the 500/mo Pro budget):
  // the check sums both ledger buckets so the arms cannot double-spend.
  const used = ledgerGet(db, PROVIDER, "details", now) + ledgerGet(db, PROVIDER, "search", now);
  const cap = fsqDailyBudget(env);
  if (used >= cap) return { ok: false, reason: "over_budget" };
  // Increment before send: a crashed call still counts against the cap.
  ledgerAdd(db, PROVIDER, "details", 1, now);

  const url = new URL(`${BASE}/places/${encodeURIComponent(fsqPlaceId)}`);
  url.searchParams.set("fields", DETAIL_FIELDS);

  let res: Response;
  try {
    res = await (deps.fetch ?? fetch)(url.toString(), {
      headers: {
        Accept: "application/json",
        "User-Agent": UA,
        Authorization: `Bearer ${apiKey}`,
        "X-Places-Api-Version": API_VERSION,
      },
    });
  } catch {
    return { ok: false, reason: "http_error" };
  }
  if (res.status === 404) return { ok: false, reason: "not_found", status: 404 };
  if (!res.ok) return { ok: false, reason: "http_error", status: res.status };

  let body: Record<string, unknown>;
  try {
    body = (await res.json()) as Record<string, unknown>;
  } catch {
    return { ok: false, reason: "bad_response" };
  }
  const place = parseDetails(body);
  if (!place) return { ok: false, reason: "bad_response" };
  return { ok: true, place };
}

/**
 * GET /places/search?ll=…&radius=…&query=… — the paid discovery arm of
 * the escalation tier (tarima-search-plan tier ladder: FSQ is a
 * shortlist/metadata source, but its search also backfills thin
 * Geoapify/Overpass result sets). One billed Pro call per request;
 * ledger bucket `search`, same daily cap env as details.
 */
export async function searchPlaces(
  db: ApiDb,
  input: {
    latitude: number;
    longitude: number;
    radiusM: number;
    query?: string;
    limit?: number;
  },
  deps: { fetch?: InjectedFetch; env?: NodeJS.ProcessEnv; now?: Date } = {},
): Promise<FsqSearchResult> {
  const env = deps.env ?? process.env;
  const apiKey = env.FSQ_API_KEY;
  if (!apiKey) return { ok: false, reason: env.FSQ_API_KEY === undefined ? "disabled" : "no_key" };

  const now = deps.now ?? new Date();
  const used = ledgerGet(db, PROVIDER, "details", now) + ledgerGet(db, PROVIDER, "search", now);
  const cap = fsqDailyBudget(env);
  if (used >= cap) return { ok: false, reason: "over_budget" };
  ledgerAdd(db, PROVIDER, "search", 1, now);

  const url = new URL(`${BASE}/places/search`);
  url.searchParams.set("ll", `${input.latitude},${input.longitude}`);
  url.searchParams.set("radius", String(Math.min(Math.max(input.radiusM, 0), 100_000)));
  url.searchParams.set("limit", String(Math.min(Math.max(input.limit ?? 10, 1), 50)));
  url.searchParams.set("fields", DETAIL_FIELDS);
  if (input.query?.trim()) url.searchParams.set("query", input.query.trim());

  let res: Response;
  try {
    res = await (deps.fetch ?? fetch)(url.toString(), {
      headers: {
        Accept: "application/json",
        "User-Agent": UA,
        Authorization: `Bearer ${apiKey}`,
        "X-Places-Api-Version": API_VERSION,
      },
    });
  } catch {
    return { ok: false, reason: "http_error" };
  }
  if (!res.ok) return { ok: false, reason: "http_error", status: res.status };

  let body: { results?: Record<string, unknown>[] };
  try {
    body = (await res.json()) as typeof body;
  } catch {
    return { ok: false, reason: "bad_response" };
  }
  const places = (Array.isArray(body.results) ? body.results : [])
    .map(parseDetails)
    .filter((p): p is FsqPlaceDetails => p !== null);
  return { ok: true, places };
}

/**
 * The only catalog columns an FSQ detail may fill. FSQ data is
 * licensed POI data (not Google content), so persistence is allowed —
 * but only through this explicit projection so a future field can
 * never leak in silently.
 */
export function fsqCatalogFields(place: FsqPlaceDetails): {
  contactPhone?: string;
  website?: string;
  contactSource: "fsq";
} {
  return {
    ...(place.phone ? { contactPhone: place.phone } : {}),
    ...(place.website ? { website: place.website } : {}),
    contactSource: "fsq",
  };
}
