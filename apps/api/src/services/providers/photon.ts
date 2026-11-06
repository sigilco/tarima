import { TARIMA_UA, type GeoPoint, type InjectedFetch } from "./types";

const PHOTON_URL = "https://photon.komoot.io/api/";

type PhotonFeature = {
  geometry?: { coordinates?: [number, number] };
  properties?: {
    name?: string;
    city?: string;
    osm_type?: string;
    osm_id?: number;
  };
};

type PhotonResponse = { features?: PhotonFeature[] };

export function photonUrl(query: string, limit = 5): string {
  const url = new URL(PHOTON_URL);
  url.searchParams.set("q", query);
  url.searchParams.set("limit", String(limit));
  return url.toString();
}

export async function geocodePhoton(
  query: string,
  fetchImpl: InjectedFetch,
): Promise<GeoPoint | null> {
  const res = await fetchImpl(photonUrl(query), {
    headers: { Accept: "application/json", "User-Agent": TARIMA_UA },
  });
  if (!res.ok) return null;
  const body = (await res.json()) as PhotonResponse;
  const feat = body.features?.[0];
  const coords = feat?.geometry?.coordinates;
  if (!coords || coords.length < 2) return null;
  const [lon, lat] = coords;
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null;
  return {
    lat,
    lon,
    city: feat?.properties?.city,
    label: feat?.properties?.name,
  };
}
