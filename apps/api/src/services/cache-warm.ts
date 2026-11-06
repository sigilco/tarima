import { searchVenues } from "./venue-search";

const DEFAULT_SEEDS: { city: string; query: string; category: string; lat: number; lon: number }[] =
  [
    {
      city: "Berkeley",
      query: "UC Berkeley",
      category: "food",
      lat: 37.8719,
      lon: -122.2585,
    },
    {
      city: "Berkeley",
      query: "UC Berkeley",
      category: "bar",
      lat: 37.8719,
      lon: -122.2585,
    },
    {
      city: "Berkeley",
      query: "UC Berkeley",
      category: "event",
      lat: 37.8719,
      lon: -122.2585,
    },
    {
      city: "Berkeley",
      query: "Downtown Berkeley",
      category: "food",
      lat: 37.8708,
      lon: -122.268,
    },
  ];

/**
 * Background cache warmer. Off unless TARIMA_PLACE_CACHE_WARM=1.
 * Respects the Overpass daily budget (the search chain skips Overpass
 * once the counter is exhausted).
 */
export async function warmPlaceCache(
  seeds = DEFAULT_SEEDS,
): Promise<{ ran: boolean; warmed: number }> {
  if (process.env.TARIMA_PLACE_CACHE_WARM !== "1") {
    return { ran: false, warmed: 0 };
  }
  let warmed = 0;
  for (const seed of seeds) {
    await searchVenues({
      city: seed.city,
      query: seed.query,
      category: seed.category,
      latitude: seed.lat,
      longitude: seed.lon,
      radiusM: 1500,
      limit: 20,
    });
    warmed += 1;
  }
  return { ran: true, warmed };
}
