/**
 * Provider set wiring: the default pair the api's venue-search service
 * uses. Kept here so the api only depends on the seam, and tests can
 * build their own pair with stub fetches.
 */
import { photonProvider } from "./photon";
import { overpassProvider } from "./overpass";
import type { VenueEnrichProvider, VenueSearchProvider } from "./types";

export interface ProviderPair {
  photon: VenueSearchProvider;
  overpass: VenueEnrichProvider;
}

/** The default provider pair (real network). */
export function defaultProviders(): ProviderPair {
  return { photon: photonProvider(), overpass: overpassProvider() };
}

export { photonProvider, overpassProvider };
export type { VenueEnrichProvider, VenueSearchProvider };
