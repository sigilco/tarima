/**
 * City presets for the venue search. A bare city name in a brief
 * (`sf`, `malaga`) maps to a bbox so the provider never searches the
 * whole planet, and to the display name the catalog stores.
 *
 * Two cities for the beta (the two research docs). Everything else
 * falls back to a free-text query with no bbox, which Photon handles
 * with its own geocoding.
 */

/** A bbox preset: [minLon, minLat, maxLon, maxLat] plus the display name. */
export interface CityPreset {
  /** The catalog city name (display form). */
  name: string;
  bbox: [number, number, number, number];
  /** Center of the bbox, used when a caller wants a point instead. */
  center: { lat: number; lon: number };
}

export const CITY_PRESETS: Record<string, CityPreset> = {
  sf: {
    name: "San Francisco",
    bbox: [-122.51, 37.7, -122.35, 37.82],
    center: { lat: 37.76, lon: -122.43 },
  },
  "san francisco": {
    name: "San Francisco",
    bbox: [-122.51, 37.7, -122.35, 37.82],
    center: { lat: 37.76, lon: -122.43 },
  },
  malaga: {
    name: "Malaga",
    bbox: [-4.43, 36.69, -4.4, 36.73],
    center: { lat: 36.71, lon: -4.42 },
  },
};

/**
 * The preset for a city string, or undefined when the city is not
 * known. The lookup is accent-insensitive and whitespace-tolerant.
 */
export function cityPreset(city: string): CityPreset | undefined {
  const key = city
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
  return CITY_PRESETS[key];
}

/** The display city name for a city string (the preset name when known). */
export function cityDisplayName(city: string): string {
  return cityPreset(city)?.name ?? city.trim();
}
