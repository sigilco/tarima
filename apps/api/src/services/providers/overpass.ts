import { and, eq } from "drizzle-orm";
import { db } from "../../db";
import { providerBudget, providerCircuit } from "../../db/schema";
import { honestContact } from "./honest-contact";
import { TARIMA_UA, type GeoPoint, type InjectedFetch, type PlaceHit } from "./types";

const OVERPASS_URL = "https://overpass-api.de/api/interpreter";
const PROVIDER = "overpass";
const DEFAULT_BUDGET = 100;
const FAILURES_TO_OPEN = 3;
const OPEN_MS = 30_000;
const TIMEOUT_MS = 8_000;
const MAX_RETRIES = 2;

export class OverpassCircuitOpenError extends Error {
  constructor() {
    super("overpass circuit open");
    this.name = "OverpassCircuitOpenError";
  }
}

export class OverpassBudgetError extends Error {
  constructor() {
    super("overpass daily budget exhausted");
    this.name = "OverpassBudgetError";
  }
}

function budgetLimit(): number {
  const n = Number.parseInt(process.env.TARIMA_PLACE_OVERPASS_BUDGET ?? "", 10);
  return Number.isFinite(n) && n >= 0 ? n : DEFAULT_BUDGET;
}

function utcDay(now: number): string {
  return new Date(now).toISOString().slice(0, 10);
}

export function overpassBudgetRemaining(now = Date.now()): number {
  const day = utcDay(now);
  const row = db
    .select()
    .from(providerBudget)
    .where(and(eq(providerBudget.provider, PROVIDER), eq(providerBudget.day, day)))
    .get();
  return Math.max(0, budgetLimit() - (row?.count ?? 0));
}

function consumeBudget(now: number): void {
  if (overpassBudgetRemaining(now) <= 0) throw new OverpassBudgetError();
  const day = utcDay(now);
  const existing = db
    .select()
    .from(providerBudget)
    .where(and(eq(providerBudget.provider, PROVIDER), eq(providerBudget.day, day)))
    .get();
  if (existing) {
    db.update(providerBudget)
      .set({ count: existing.count + 1 })
      .where(and(eq(providerBudget.provider, PROVIDER), eq(providerBudget.day, day)))
      .run();
    return;
  }
  db.insert(providerBudget).values({ provider: PROVIDER, day, count: 1 }).run();
}

export function overpassCircuitState(): { state: string; failures: number } {
  const row = db.select().from(providerCircuit).where(eq(providerCircuit.provider, PROVIDER)).get();
  return { state: row?.state ?? "closed", failures: row?.failures ?? 0 };
}

function recordSuccess(): void {
  db.insert(providerCircuit)
    .values({ provider: PROVIDER, failures: 0, openedAt: null, state: "closed" })
    .onConflictDoUpdate({
      target: providerCircuit.provider,
      set: { failures: 0, openedAt: null, state: "closed" },
    })
    .run();
}

function recordFailure(now: number): void {
  const row = db.select().from(providerCircuit).where(eq(providerCircuit.provider, PROVIDER)).get();
  const failures = (row?.failures ?? 0) + 1;
  const open = failures >= FAILURES_TO_OPEN;
  db.insert(providerCircuit)
    .values({
      provider: PROVIDER,
      failures,
      openedAt: open ? now : null,
      state: open ? "open" : "closed",
    })
    .onConflictDoUpdate({
      target: providerCircuit.provider,
      set: {
        failures,
        openedAt: open ? now : null,
        state: open ? "open" : "closed",
      },
    })
    .run();
}

function assertCircuit(now: number): void {
  const row = db.select().from(providerCircuit).where(eq(providerCircuit.provider, PROVIDER)).get();
  if (!row || row.state !== "open") return;
  const opened = row.openedAt ?? 0;
  if (now - opened >= OPEN_MS) {
    db.update(providerCircuit)
      .set({ state: "half-open" })
      .where(eq(providerCircuit.provider, PROVIDER))
      .run();
    return;
  }
  throw new OverpassCircuitOpenError();
}

export function overpassQuery(center: GeoPoint, radiusM: number, category?: string): string {
  const c = (category ?? "food").toLowerCase();
  let filter = '["amenity"~"restaurant|cafe|fast_food|bar|pub"]';
  if (/(brew)/.test(c)) filter = '["craft"~"brewery|brewpub"]';
  else if (/(bar|pub)/.test(c)) filter = '["amenity"~"bar|pub"]';
  else if (/(event|venue|hall|community)/.test(c)) {
    filter = '["amenity"~"events_venue|community_centre|conference_centre|multipurpose"]';
  } else if (/(shop|supermarket|grocery)/.test(c)) {
    filter = '["shop"~"supermarket|convenience|greengrocer"]';
  }
  const around = `(around:${radiusM},${center.lat},${center.lon})`;
  return `[out:json][timeout:25];(node${filter}${around};way${filter}${around};);out center tags;`;
}

type OverpassElement = {
  type: string;
  id: number;
  lat?: number;
  lon?: number;
  center?: { lat: number; lon: number };
  tags?: Record<string, string>;
};

export function parseOverpassElements(
  elements: OverpassElement[],
  fallbackCity: string,
): PlaceHit[] {
  const hits: PlaceHit[] = [];
  for (const el of elements) {
    const tags = el.tags ?? {};
    if (Object.keys(tags).some((k) => k.startsWith("disused:"))) continue;
    const name = tags.name?.trim();
    if (!name) continue;
    const lat = el.lat ?? el.center?.lat;
    const lon = el.lon ?? el.center?.lon;
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) continue;
    const contact = honestContact({
      email: tags.email ?? tags["contact:email"],
      phone: tags.phone ?? tags["contact:phone"],
      website: tags.website ?? tags["contact:website"] ?? tags.url,
      source: "osm",
    });
    const capRaw = tags.capacity ?? tags["max_capacity"];
    const capacity = capRaw ? Number.parseInt(capRaw, 10) : undefined;
    hits.push({
      externalId: `${el.type}/${el.id}`,
      name,
      city: tags["addr:city"] ?? fallbackCity,
      area: tags["addr:street"],
      latitude: lat as number,
      longitude: lon as number,
      website: contact.website,
      contactEmail: contact.email,
      contactPhone: contact.phone,
      openingHours: tags.opening_hours,
      capacity: Number.isInteger(capacity) && (capacity as number) > 0 ? capacity : undefined,
      provider: "overpass",
      contactSource: contact.source,
    });
  }
  return hits;
}

async function fetchWithRetry(
  query: string,
  fetchImpl: InjectedFetch,
  timeoutMs: number,
): Promise<Response> {
  let last: Response | undefined;
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    const ac = new AbortController();
    const timer = setTimeout(() => ac.abort(), timeoutMs);
    try {
      last = await fetchImpl(OVERPASS_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Accept: "application/json",
          "User-Agent": TARIMA_UA,
        },
        body: `data=${encodeURIComponent(query)}`,
        signal: ac.signal,
      });
    } catch (err) {
      clearTimeout(timer);
      if (attempt === MAX_RETRIES) throw err;
      await sleep(50 * 2 ** attempt);
      continue;
    }
    clearTimeout(timer);
    if (last.ok) return last;
    if (last.status === 502 || last.status === 429 || last.status === 406) {
      if (attempt === MAX_RETRIES) return last;
      await sleep(50 * 2 ** attempt);
      continue;
    }
    return last;
  }
  return last as Response;
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

export async function searchOverpass(opts: {
  center: GeoPoint;
  radiusM: number;
  category?: string;
  fetch: InjectedFetch;
  now?: number;
  timeoutMs?: number;
}): Promise<PlaceHit[]> {
  const now = opts.now ?? Date.now();
  assertCircuit(now);
  consumeBudget(now);
  const query = overpassQuery(opts.center, opts.radiusM, opts.category);
  const res = await fetchWithRetry(query, opts.fetch, opts.timeoutMs ?? TIMEOUT_MS);
  if (!res.ok) {
    recordFailure(now);
    if (overpassCircuitState().state === "open") throw new OverpassCircuitOpenError();
    throw new Error(`overpass ${res.status}`);
  }
  recordSuccess();
  const body = (await res.json()) as { elements?: OverpassElement[] };
  return parseOverpassElements(body.elements ?? [], opts.center.city ?? "unknown");
}
