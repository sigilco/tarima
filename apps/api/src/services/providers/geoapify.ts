import { TARIMA_UA, type GeoPoint, type InjectedFetch, type PlaceHit } from "./types";
import { honestContact } from "./honest-contact";

const PLACES_URL = "https://api.geoapify.com/v2/places";
const GEOCODE_URL = "https://api.geoapify.com/v1/geocode/search";

type GeoapifyFeature = {
  properties?: {
    name?: string;
    city?: string;
    district?: string;
    suburb?: string;
    street?: string;
    lat?: number;
    lon?: number;
    website?: string;
    opening_hours?: string;
    place_id?: string;
    contact?: { phone?: string; email?: string };
    datasource?: {
      raw?: Record<string, unknown>;
    };
  };
  geometry?: { coordinates?: [number, number] };
};

type GeoapifyResponse = { features?: GeoapifyFeature[] };

export function geoapifyCategories(category?: string): string {
  const c = (category ?? "food").toLowerCase();
  if (/(brew|bar|pub)/.test(c)) return "catering.bar,catering.pub";
  if (/(event|venue|hall|community|conference)/.test(c)) {
    return "activity.community_center,building.historic,entertainment";
  }
  if (/(shop|grocery|supermarket)/.test(c)) {
    return "commercial.supermarket,commercial.food_and_drink";
  }
  if (/(cafe|coffee)/.test(c)) return "catering.cafe";
  if (/(restaurant|food|cater)/.test(c)) {
    return "catering.restaurant,catering.cafe,catering.bar,catering.pub";
  }
  return "catering.restaurant,catering.cafe,catering.bar,catering.pub";
}

export function geoapifyPlacesUrl(opts: {
  lon: number;
  lat: number;
  radiusM: number;
  category?: string;
  limit: number;
  apiKey: string;
}): string {
  const url = new URL(PLACES_URL);
  url.searchParams.set("categories", geoapifyCategories(opts.category));
  url.searchParams.set("filter", `circle:${opts.lon},${opts.lat},${opts.radiusM}`);
  url.searchParams.set("bias", `proximity:${opts.lon},${opts.lat}`);
  url.searchParams.set("limit", String(opts.limit));
  url.searchParams.set("apiKey", opts.apiKey);
  return url.toString();
}

export function geoapifyGeocodeUrl(query: string, apiKey: string): string {
  const url = new URL(GEOCODE_URL);
  url.searchParams.set("text", query);
  url.searchParams.set("limit", "1");
  url.searchParams.set("apiKey", apiKey);
  return url.toString();
}

export async function geocodeGeoapify(
  query: string,
  apiKey: string,
  fetchImpl: InjectedFetch,
): Promise<GeoPoint | null> {
  const res = await fetchImpl(geoapifyGeocodeUrl(query, apiKey), {
    headers: { Accept: "application/json", "User-Agent": TARIMA_UA },
  });
  if (!res.ok) return null;
  const body = (await res.json()) as GeoapifyResponse;
  const feat = body.features?.[0];
  const lat = feat?.properties?.lat;
  const lon = feat?.properties?.lon;
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null;
  return {
    lat: lat as number,
    lon: lon as number,
    city: feat?.properties?.city,
    label: feat?.properties?.name,
  };
}

export function parseGeoapifyPlaces(body: GeoapifyResponse, fallbackCity: string): PlaceHit[] {
  const hits: PlaceHit[] = [];
  for (const feat of body.features ?? []) {
    const p = feat.properties ?? {};
    const name = p.name?.trim();
    if (!name) continue;
    const lat = p.lat ?? feat.geometry?.coordinates?.[1];
    const lon = p.lon ?? feat.geometry?.coordinates?.[0];
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) continue;
    const raw = (p.datasource?.raw ?? {}) as Record<string, unknown>;
    const phone = p.contact?.phone ?? str(raw.phone) ?? str(raw["contact:phone"]);
    const email = p.contact?.email ?? str(raw.email) ?? str(raw["contact:email"]);
    const website = p.website ?? str(raw.website) ?? str(raw.url);
    const contact = honestContact({
      email,
      phone,
      website,
      source: "geoapify",
    });
    hits.push({
      externalId: p.place_id ?? `geoapify/${name}`,
      name,
      city: p.city ?? fallbackCity,
      area: p.district ?? p.suburb ?? p.street,
      latitude: lat as number,
      longitude: lon as number,
      website: contact.website,
      contactEmail: contact.email,
      contactPhone: contact.phone,
      openingHours: p.opening_hours ?? str(raw.opening_hours),
      provider: "geoapify",
      contactSource: contact.source,
    });
  }
  return hits;
}

export async function searchGeoapifyPlaces(opts: {
  center: GeoPoint;
  radiusM: number;
  category?: string;
  limit: number;
  apiKey: string;
  fetch: InjectedFetch;
}): Promise<PlaceHit[]> {
  const url = geoapifyPlacesUrl({
    lon: opts.center.lon,
    lat: opts.center.lat,
    radiusM: opts.radiusM,
    category: opts.category,
    limit: opts.limit,
    apiKey: opts.apiKey,
  });
  const res = await opts.fetch(url, {
    headers: { Accept: "application/json", "User-Agent": TARIMA_UA },
  });
  if (!res.ok) throw new Error(`geoapify places ${res.status}`);
  const body = (await res.json()) as GeoapifyResponse;
  return parseGeoapifyPlaces(body, opts.center.city ?? "unknown");
}

function str(v: unknown): string | undefined {
  return typeof v === "string" && v.trim() ? v.trim() : undefined;
}
