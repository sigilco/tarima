import type { ContactSource } from "@tarima/contract";

export type InjectedFetch = typeof fetch;

export type GeoPoint = { lat: number; lon: number; city?: string; label?: string };

export type PlaceHit = {
  externalId: string;
  name: string;
  city: string;
  area?: string;
  latitude: number;
  longitude: number;
  website?: string;
  contactEmail?: string;
  contactPhone?: string;
  openingHours?: string;
  capacity?: number;
  provider: string;
  contactSource?: ContactSource;
};

export type PlaceProvider = {
  id: string;
  search(input: {
    center: GeoPoint;
    radiusM: number;
    category?: string;
    limit: number;
    fetch: InjectedFetch;
  }): Promise<PlaceHit[]>;
};

export const TARIMA_UA = "tarima-bot/0.1 (+https://tarima.local)";
