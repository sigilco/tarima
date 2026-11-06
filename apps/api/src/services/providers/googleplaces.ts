/**
 * Google Places API (New) escalation provider — GATED OFF by default.
 *
 * Design source: docs/handoff/context/tarima-gmaps.md §2.5 and §3.
 *
 * Hard rules encoded here, not just documented:
 * - `GOOGLE_PLACES_ENABLED` must be "1"/"true" or every call returns
 *   `{ ok: false, reason: "disabled" }` without touching the network.
 * - Field masks live in a tier table: a Pro-tier call can never carry
 *   an Enterprise field, and an Enterprise mask is refused unless
 *   `GOOGLE_PLACES_FIELD_TIER=enterprise` AND today's enterprise ledger
 *   bucket is under `GOOGLE_PLACES_ENTERPRISE_DAILY`.
 * - The API key travels in the `X-Goog-Api-Key` header only — never a
 *   query parameter, never logged, never persisted.
 * - NOTHING Google returns is persisted. The only catalog-safe
 *   projection is `googleCatalogProvenance()` → place_id + provenance;
 *   display fields (name, phone, website, hours, rating…) live in the
 *   session response only (Places ToS §3.2.3: place_id may be stored
 *   indefinitely, everything else may not be cached).
 * - Budgets are app-side, in `provider_ledger`, day = America/Los_Angeles:
 *   `live` counts every call against GOOGLE_PLACES_DAILY_BUDGET;
 *   `enterprise` counts Enterprise-mask calls against
 *   GOOGLE_PLACES_ENTERPRISE_DAILY; `warm` counts cache-warming calls
 *   against GOOGLE_PLACES_WARM_DAILY (default 0 = warming never spends).
 * - Per-method circuit breaker (cauce health.rs semantics): failures
 *   within 5 min open the method for 30 s + jitter; a 429 counts double
 *   and additionally marks the provider over-budget for the day —
 *   Enterprise masks are never retried after a 429 that day.
 * - Same (method, key, tier) within 24 h is served from an in-memory
 *   session cache instead of a second billed call.
 */
import type { ApiDb } from "../projects";
import { ledgerAdd, ledgerGet } from "./ledger";

export type InjectedFetch = typeof fetch;

const BASE = "https://places.googleapis.com/v1";
const PROVIDER = "google-places";
const UA = "tarima-bot/0.1 (+https://tarima.local)";

// ---------------------------------------------------------------------------
// Field-mask tiers (tarima-gmaps.md §1.2). Masks are the ONLY place field
// names appear; a tier can never include a field from a higher SKU.
// ---------------------------------------------------------------------------

export type GoogleFieldTier = "ids" | "pro" | "enterprise";

const MASK_IDS = "places.id,places.name,nextPageToken";
const MASK_PRO = [
  "places.id",
  "places.displayName",
  "places.location",
  "places.types",
  "places.formattedAddress",
  "places.businessStatus",
  "places.googleMapsUri",
  "places.timeZone",
].join(",");
const MASK_ENTERPRISE = [
  MASK_PRO,
  "places.nationalPhoneNumber",
  "places.websiteUri",
  "places.regularOpeningHours",
  "places.rating",
  "places.userRatingCount",
  "places.priceLevel",
].join(",");

/** The field mask a tier is allowed to send. `ids` is Text-Search-only. */
export function fieldMaskFor(tier: GoogleFieldTier): string {
  switch (tier) {
    case "ids":
      return MASK_IDS;
    case "pro":
      return MASK_PRO;
    case "enterprise":
      return MASK_ENTERPRISE;
  }
}

// ---------------------------------------------------------------------------
// Config (read at call time so tests and env changes take effect).
// ---------------------------------------------------------------------------

export interface GooglePlacesConfig {
  enabled: boolean;
  apiKey?: string;
  /** Ceiling for live calls: "pro" caps every call at Pro fields. */
  fieldTier: "pro" | "enterprise";
  /** App-side daily cap for live calls (Google-side quota is the belt). */
  dailyBudget: number;
  /** Of dailyBudget's day, how many calls may use Enterprise masks. */
  enterpriseDaily: number;
  /** Cache-warming daily cap; 0 = warming never spends Google calls. */
  warmDaily: number;
}

function envInt(env: NodeJS.ProcessEnv, key: string, fallback: number): number {
  const raw = env[key];
  if (raw === undefined || raw === "") return fallback;
  const n = Number.parseInt(raw, 10);
  return Number.isFinite(n) && n >= 0 ? n : fallback;
}

export function googlePlacesConfig(env: NodeJS.ProcessEnv = process.env): GooglePlacesConfig {
  const tier = env.GOOGLE_PLACES_FIELD_TIER;
  return {
    enabled: env.GOOGLE_PLACES_ENABLED === "1" || env.GOOGLE_PLACES_ENABLED === "true",
    apiKey: env.GOOGLE_MAPS_API_KEY || undefined,
    fieldTier: tier === "enterprise" ? "enterprise" : "pro",
    dailyBudget: envInt(env, "GOOGLE_PLACES_DAILY_BUDGET", 10),
    enterpriseDaily: envInt(env, "GOOGLE_PLACES_ENTERPRISE_DAILY", 10),
    warmDaily: envInt(env, "GOOGLE_PLACES_WARM_DAILY", 0),
  };
}

// ---------------------------------------------------------------------------
// Circuit breaker (per method, in-memory — same shape as cauce health.rs).
// ---------------------------------------------------------------------------

type BreakerState = { events: number[]; openedUntil: number };
const BREAKERS = new Map<string, BreakerState>();
const BREAKER_WINDOW_MS = 5 * 60_000;
const BREAKER_OPEN_MS = 30_000;
let breakerNow = () => Date.now();

/** Test hook: control time and clear breaker state. */
export function resetGooglePlacesBreakers(now?: () => number): void {
  BREAKERS.clear();
  if (now) breakerNow = now;
  else breakerNow = () => Date.now();
}

function breakerRecord(method: string, weight: number): void {
  const now = breakerNow();
  const state = BREAKERS.get(method) ?? { events: [], openedUntil: 0 };
  state.events = state.events.filter((t) => now - t < BREAKER_WINDOW_MS);
  // A failure inside the window counts `weight` times (429 = double).
  for (let i = 0; i < weight; i++) state.events.push(now);
  if (state.events.length >= 3 && state.openedUntil <= now) {
    state.openedUntil = now + BREAKER_OPEN_MS + Math.floor(Math.random() * BREAKER_OPEN_MS);
  }
  BREAKERS.set(method, state);
}

function breakerOpen(method: string): boolean {
  const state = BREAKERS.get(method);
  if (!state) return false;
  return breakerNow() < state.openedUntil;
}

function breakerSuccess(method: string): void {
  BREAKERS.delete(method);
}

// ---------------------------------------------------------------------------
// Session idempotence: same (method, input, tier) within 24 h is free.
// ---------------------------------------------------------------------------

const SESSION_TTL_MS = 24 * 60 * 60_000;
type GooglePlacesOk = Extract<GooglePlacesResult, { ok: true }>;
const SESSION = new Map<string, { at: number; value: GooglePlacesOk }>();

function sessionKey(parts: unknown[]): string {
  return JSON.stringify(parts);
}

function sessionGet(key: string): GooglePlacesOk | undefined {
  const hit = SESSION.get(key);
  if (!hit) return undefined;
  if (Date.now() - hit.at > SESSION_TTL_MS) {
    SESSION.delete(key);
    return undefined;
  }
  return hit.value;
}

function sessionPut(key: string, value: GooglePlacesOk): void {
  SESSION.set(key, { at: Date.now(), value });
}

/** Test hook. */
export function resetGooglePlacesSession(): void {
  SESSION.clear();
}

// ---------------------------------------------------------------------------
// Wire types (session-only; nothing here is ever persisted).
// ---------------------------------------------------------------------------

export interface GooglePlace {
  placeId: string;
  displayName?: string;
  location?: { lat: number; lon: number };
  formattedAddress?: string;
  types?: string[];
  businessStatus?: string;
  googleMapsUri?: string;
  timeZone?: string;
  phone?: string;
  website?: string;
  hours?: string[];
  rating?: number;
  reviewCount?: number;
  priceLevel?: string;
}

export type GooglePlacesFailure =
  | "disabled"
  | "no_key"
  | "tier_refused"
  | "over_budget"
  | "breaker_open"
  | "rate_limited"
  | "http_error"
  | "bad_response";

export type GooglePlacesResult =
  | {
      ok: true;
      tier: GoogleFieldTier;
      places: GooglePlace[];
      nextPageToken?: string;
      /** True when answered from the 24 h session cache (no billed call). */
      cached: boolean;
    }
  | { ok: false; reason: GooglePlacesFailure; status?: number; detail?: string };

export type GooglePurpose = "live" | "warm";

// ---------------------------------------------------------------------------
// Budget gate. Order matters: enabled → key → tier → purpose budget → send.
// ---------------------------------------------------------------------------

function budgetCheck(
  db: ApiDb,
  cfg: GooglePlacesConfig,
  tier: GoogleFieldTier,
  purpose: GooglePurpose,
  now: Date,
): GooglePlacesFailure | null {
  const liveUsed = ledgerGet(db, PROVIDER, "live", now);
  if (purpose === "warm") {
    if (cfg.warmDaily <= 0) return "over_budget";
    if (liveUsed > Math.floor(cfg.dailyBudget / 2)) return "over_budget";
    if (ledgerGet(db, PROVIDER, "warm", now) >= cfg.warmDaily) return "over_budget";
  } else if (liveUsed >= cfg.dailyBudget) {
    return "over_budget";
  }
  if (tier === "enterprise") {
    if (cfg.fieldTier !== "enterprise") return "tier_refused";
    if (ledgerGet(db, PROVIDER, "enterprise", now) >= cfg.enterpriseDaily) {
      return "tier_refused";
    }
  }
  return null;
}

function ledgerSpend(db: ApiDb, tier: GoogleFieldTier, purpose: GooglePurpose, now: Date): void {
  ledgerAdd(db, PROVIDER, "live", 1, now);
  if (tier === "enterprise") ledgerAdd(db, PROVIDER, "enterprise", 1, now);
  if (purpose === "warm") ledgerAdd(db, PROVIDER, "warm", 1, now);
}

// ---------------------------------------------------------------------------
// HTTP
// ---------------------------------------------------------------------------

type RawPlace = Record<string, unknown>;

function str(v: unknown): string | undefined {
  return typeof v === "string" && v.length > 0 ? v : undefined;
}

function num(v: unknown): number | undefined {
  return typeof v === "number" && Number.isFinite(v) ? v : undefined;
}

function displayText(v: unknown): string | undefined {
  if (typeof v === "string") return v || undefined;
  if (v && typeof v === "object") return str((v as RawPlace).text);
  return undefined;
}

function parsePlace(raw: RawPlace): GooglePlace | null {
  const placeId = str(raw.id);
  if (!placeId) return null;
  const loc = raw.location as RawPlace | undefined;
  const hours = raw.regularOpeningHours as RawPlace | undefined;
  const place: GooglePlace = { placeId };
  const name = displayText(raw.displayName);
  if (name) place.displayName = name;
  const lat = num(loc?.latitude);
  const lon = num(loc?.longitude);
  if (lat !== undefined && lon !== undefined) place.location = { lat, lon };
  const addr = str(raw.formattedAddress);
  if (addr) place.formattedAddress = addr;
  if (Array.isArray(raw.types)) {
    place.types = raw.types.filter((t): t is string => typeof t === "string");
  }
  const bs = str(raw.businessStatus);
  if (bs) place.businessStatus = bs;
  const uri = str(raw.googleMapsUri);
  if (uri) place.googleMapsUri = uri;
  const tz = str(raw.timeZone);
  if (tz) place.timeZone = tz;
  const phone = str(raw.nationalPhoneNumber) ?? str(raw.internationalPhoneNumber);
  if (phone) place.phone = phone;
  const web = str(raw.websiteUri);
  if (web) place.website = web;
  if (Array.isArray(hours?.weekdayDescriptions)) {
    place.hours = (hours.weekdayDescriptions as unknown[]).filter(
      (h): h is string => typeof h === "string",
    );
  }
  const rating = num(raw.rating);
  if (rating !== undefined) place.rating = rating;
  const rc = num(raw.userRatingCount);
  if (rc !== undefined) place.reviewCount = rc;
  const pl = str(raw.priceLevel);
  if (pl) place.priceLevel = pl;
  return place;
}

async function callGoogle(
  db: ApiDb,
  cfg: GooglePlacesConfig,
  method: string,
  url: string,
  init: { method: "GET" | "POST"; body?: unknown; fieldMask: string; shape: "list" | "single" },
  tier: GoogleFieldTier,
  purpose: GooglePurpose,
  fetchImpl: InjectedFetch,
  now: Date,
): Promise<GooglePlacesResult> {
  if (breakerOpen(method)) {
    return { ok: false, reason: "breaker_open" };
  }
  const denied = budgetCheck(db, cfg, tier, purpose, now);
  if (denied) return { ok: false, reason: denied };
  ledgerSpend(db, tier, purpose, now);

  let res: Response;
  try {
    res = await fetchImpl(url, {
      method: init.method,
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        "User-Agent": UA,
        // Header-only key: never a query parameter (tarima-gmaps §2.2).
        "X-Goog-Api-Key": cfg.apiKey ?? "",
        "X-Goog-FieldMask": init.fieldMask,
      },
      ...(init.body !== undefined ? { body: JSON.stringify(init.body) } : {}),
    });
  } catch (err) {
    breakerRecord(method, 1);
    return {
      ok: false,
      reason: "http_error",
      detail: err instanceof Error ? err.message : String(err),
    };
  }

  if (res.status === 429) {
    // RESOURCE_EXHAUSTED: Cloud quota or per-minute limit. Open the
    // breaker (double weight) and answer degraded; never retry an
    // Enterprise mask today (budgetCheck's enterprise bucket stays
    // under cap, but the breaker blocks the method regardless).
    breakerRecord(method, 2);
    return { ok: false, reason: "rate_limited", status: 429 };
  }
  if (!res.ok) {
    breakerRecord(method, 1);
    return { ok: false, reason: "http_error", status: res.status };
  }

  let body: { places?: RawPlace[]; nextPageToken?: string } & RawPlace;
  try {
    body = (await res.json()) as typeof body;
  } catch {
    breakerRecord(method, 1);
    return { ok: false, reason: "bad_response" };
  }
  breakerSuccess(method);

  // Search endpoints return `{ places: [...] }`; Place Details returns
  // the place object itself at the top level.
  const rawList =
    init.shape === "single" ? [body as RawPlace] : Array.isArray(body.places) ? body.places : [];
  const places = rawList.map(parsePlace).filter((p): p is GooglePlace => p !== null);
  return {
    ok: true,
    tier,
    places,
    ...(typeof body.nextPageToken === "string" ? { nextPageToken: body.nextPageToken } : {}),
    cached: false,
  };
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export interface NearbyInput {
  latitude: number;
  longitude: number;
  radiusM: number;
  includedTypes?: string[];
  maxResultCount?: number;
}

export interface TextInput {
  textQuery: string;
  latitude?: number;
  longitude?: number;
  radiusM?: number;
  pageSize?: number;
  pageToken?: string;
}

export interface CallDeps {
  fetch?: InjectedFetch;
  now?: Date;
  purpose?: GooglePurpose;
  env?: NodeJS.ProcessEnv;
}

/**
 * POST /v1/places:searchNearby. `tier` defaults to the configured
 * FIELD_TIER ceiling clamped to "pro" for discovery calls — callers
 * that want phone/website/hours must ask for "enterprise" explicitly
 * and still pass the env gate.
 */
export async function searchNearby(
  db: ApiDb,
  input: NearbyInput,
  tier: GoogleFieldTier = "pro",
  deps: CallDeps = {},
): Promise<GooglePlacesResult> {
  const cfg = googlePlacesConfig(deps.env);
  if (!cfg.enabled) return { ok: false, reason: "disabled" };
  if (!cfg.apiKey) return { ok: false, reason: "no_key" };
  const now = deps.now ?? new Date();
  const method = "searchNearby";
  const cacheKey = sessionKey([method, input, tier]);
  const hit = sessionGet(cacheKey);
  if (hit) return { ...hit, cached: true };

  const body: Record<string, unknown> = {
    locationRestriction: {
      circle: {
        center: { latitude: input.latitude, longitude: input.longitude },
        radius: Math.min(Math.max(input.radiusM, 0), 50_000),
      },
    },
    rankPreference: "DISTANCE",
    pageSize: Math.min(Math.max(input.maxResultCount ?? 20, 1), 20),
  };
  if (input.includedTypes?.length) body.includedTypes = input.includedTypes;

  const result = await callGoogle(
    db,
    cfg,
    method,
    `${BASE}/places:searchNearby`,
    { method: "POST", body, fieldMask: fieldMaskFor(tier), shape: "list" },
    tier,
    deps.purpose ?? "live",
    deps.fetch ?? fetch,
    now,
  );
  if (result.ok) sessionPut(cacheKey, result);
  return result;
}

/**
 * POST /v1/places:searchText. `ids` tier is the $0 discovery mask
 * (vibe/feature queries per tarima-gmaps §3.1); `pro`/`enterprise`
 * escalate fields under the same gates as Nearby.
 */
export async function searchText(
  db: ApiDb,
  input: TextInput,
  tier: GoogleFieldTier = "ids",
  deps: CallDeps = {},
): Promise<GooglePlacesResult> {
  const cfg = googlePlacesConfig(deps.env);
  if (!cfg.enabled) return { ok: false, reason: "disabled" };
  if (!cfg.apiKey) return { ok: false, reason: "no_key" };
  const now = deps.now ?? new Date();
  const method = "searchText";
  const cacheKey = sessionKey([method, input, tier]);
  const hit = sessionGet(cacheKey);
  if (hit) return { ...hit, cached: true };

  const body: Record<string, unknown> = {
    textQuery: input.textQuery,
    pageSize: Math.min(Math.max(input.pageSize ?? 20, 1), 20),
  };
  if (input.latitude !== undefined && input.longitude !== undefined) {
    body.locationRestriction = {
      circle: {
        center: { latitude: input.latitude, longitude: input.longitude },
        radius: Math.min(Math.max(input.radiusM ?? 1500, 0), 50_000),
      },
    };
  }
  if (input.pageToken) body.pageToken = input.pageToken;

  const result = await callGoogle(
    db,
    cfg,
    method,
    `${BASE}/places:searchText`,
    { method: "POST", body, fieldMask: fieldMaskFor(tier), shape: "list" },
    tier,
    deps.purpose ?? "live",
    deps.fetch ?? fetch,
    now,
  );
  if (result.ok) sessionPut(cacheKey, result);
  return result;
}

/**
 * GET /v1/places/{placeId} — the shortlist "detail pass"
 * (tarima-gmaps §3.1 use 2). Enterprise tier carries phone, website,
 * hours, rating, price; the result is session-only.
 */
export async function placeDetails(
  db: ApiDb,
  placeId: string,
  tier: GoogleFieldTier = "enterprise",
  deps: CallDeps = {},
): Promise<GooglePlacesResult> {
  const cfg = googlePlacesConfig(deps.env);
  if (!cfg.enabled) return { ok: false, reason: "disabled" };
  if (!cfg.apiKey) return { ok: false, reason: "no_key" };
  const now = deps.now ?? new Date();
  const method = "placeDetails";
  const cacheKey = sessionKey([method, placeId, tier]);
  const hit = sessionGet(cacheKey);
  if (hit) return { ...hit, cached: true };

  const result = await callGoogle(
    db,
    cfg,
    method,
    `${BASE}/places/${encodeURIComponent(placeId)}`,
    { method: "GET", fieldMask: fieldMaskFor(tier), shape: "single" },
    tier,
    deps.purpose ?? "live",
    deps.fetch ?? fetch,
    now,
  );
  if (result.ok) sessionPut(cacheKey, result);
  return result;
}

// ---------------------------------------------------------------------------
// The ONLY persistable projection (Places ToS §3.2.3).
// ---------------------------------------------------------------------------

export interface GoogleCatalogProvenance {
  /** `g:<place_id>` — the one Google value allowed in the catalog. */
  externalId: string;
  provider: "google";
  /** Means "re-query Google live for contact"; never a stored contact. */
  contactSource: "google";
}

/**
 * Map a session GooglePlace to the catalog-safe provenance row.
 * Deliberately drops every display field: name, address, phone,
 * website, hours, rating, price, atmosphere flags. The unit test pins
 * this allowlist — adding a key here is a ToS change, not a refactor.
 */
export function googleCatalogProvenance(place: GooglePlace): GoogleCatalogProvenance {
  return {
    externalId: `g:${place.placeId}`,
    provider: "google",
    contactSource: "google",
  };
}
