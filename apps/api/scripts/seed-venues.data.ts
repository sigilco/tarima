/**
 * Seed data for the venue catalog, transcribed from the beta research
 * docs (docs/venue_candidates_sf.md, docs/venue_candidates_malaga.md).
 * Capacity figures are estimates for the venues where the docs give a
 * size signal; most rows carry none, and curation only enforces
 * capacity when a row has one. Price bands are not yet measured, so
 * they stay unset until the provider chain fills them.
 */
export interface SeedVenue {
  city: string;
  name: string;
  area?: string;
  capacity?: number;
  priceBand?: "low" | "mid" | "high" | "premium";
  source: string;
  url?: string;
}

export const SF_VENUES: SeedVenue[] = [
  // Mission (docs/venue_candidates_sf.md)
  {
    city: "San Francisco",
    name: "Muddy Waters Coffee House",
    area: "Mission",
    capacity: 30,
    source: "docs/venue_candidates_sf.md",
  },
  {
    city: "San Francisco",
    name: "Manny's",
    area: "Mission",
    capacity: 80,
    source: "docs/venue_candidates_sf.md",
  },
  {
    city: "San Francisco",
    name: "Medicine for Nightmares",
    area: "Mission",
    capacity: 30,
    source: "docs/venue_candidates_sf.md",
  },
  {
    city: "San Francisco",
    name: "Stable Cafe",
    area: "Mission",
    capacity: 60,
    source: "docs/venue_candidates_sf.md",
  },
  {
    city: "San Francisco",
    name: "Haus Coffee",
    area: "Mission",
    capacity: 25,
    source: "docs/venue_candidates_sf.md",
  },
  {
    city: "San Francisco",
    name: "Sightglass Coffee",
    area: "Mission",
    capacity: 50,
    source: "docs/venue_candidates_sf.md",
  },
  {
    city: "San Francisco",
    name: "The Sycamore",
    area: "Mission",
    capacity: 60,
    source: "docs/venue_candidates_sf.md",
  },
  {
    city: "San Francisco",
    name: "El Rio",
    area: "Mission",
    capacity: 80,
    source: "docs/venue_candidates_sf.md",
  },
  {
    city: "San Francisco",
    name: "Kilowatt",
    area: "Mission",
    capacity: 50,
    source: "docs/venue_candidates_sf.md",
  },
  {
    city: "San Francisco",
    name: "Amado's",
    area: "Mission",
    capacity: 100,
    source: "docs/venue_candidates_sf.md",
  },
  {
    city: "San Francisco",
    name: "Make-Out Room",
    area: "Mission",
    capacity: 100,
    source: "docs/venue_candidates_sf.md",
  },
  {
    city: "San Francisco",
    name: "Adobe Books",
    area: "Mission",
    capacity: 20,
    source: "docs/venue_candidates_sf.md",
  },
  {
    city: "San Francisco",
    name: "Borderlands Books",
    area: "Mission",
    capacity: 20,
    source: "docs/venue_candidates_sf.md",
  },
  {
    city: "San Francisco",
    name: "Southern Pacific Brewing",
    area: "Mission",
    capacity: 150,
    source: "docs/venue_candidates_sf.md",
  },
  // Hayes Valley / Divisadero
  {
    city: "San Francisco",
    name: "Rick & Roxy's",
    area: "Hayes Valley",
    capacity: 60,
    source: "docs/venue_candidates_sf.md",
  },
  {
    city: "San Francisco",
    name: "The Function",
    area: "Market",
    capacity: 100,
    source: "docs/venue_candidates_sf.md",
  },
  {
    city: "San Francisco",
    name: "Two Sisters Bar & Books",
    area: "Hayes Valley",
    capacity: 30,
    source: "docs/venue_candidates_sf.md",
  },
  {
    city: "San Francisco",
    name: "Dobbs Ferry",
    area: "Hayes Valley",
    capacity: 40,
    source: "docs/venue_candidates_sf.md",
  },
  {
    city: "San Francisco",
    name: "Anina",
    area: "Hayes Valley",
    capacity: 30,
    source: "docs/venue_candidates_sf.md",
  },
  {
    city: "San Francisco",
    name: "Birba",
    area: "Hayes Valley",
    capacity: 40,
    source: "docs/venue_candidates_sf.md",
  },
  {
    city: "San Francisco",
    name: "Biergarten",
    area: "Hayes Valley",
    capacity: 80,
    source: "docs/venue_candidates_sf.md",
  },
  {
    city: "San Francisco",
    name: "Mojo Bicycle Cafe",
    area: "Divisadero",
    capacity: 25,
    source: "docs/venue_candidates_sf.md",
  },
];

export const MALAGA_VENUES: SeedVenue[] = [
  // Centro Historico (docs/venue_candidates_malaga.md, tier 1)
  {
    city: "Malaga",
    name: "Bakkano 2.0",
    area: "Centro",
    capacity: 50,
    source: "docs/venue_candidates_malaga.md",
  },
  {
    city: "Malaga",
    name: "Sala Premier",
    area: "Centro",
    capacity: 40,
    source: "docs/venue_candidates_malaga.md",
  },
  {
    city: "Malaga",
    name: "The Garrison's Tavern",
    area: "Centro",
    capacity: 40,
    source: "docs/venue_candidates_malaga.md",
  },
  {
    city: "Malaga",
    name: "El Colmao",
    area: "Centro",
    capacity: 50,
    source: "docs/venue_candidates_malaga.md",
  },
  {
    city: "Malaga",
    name: "O'Hara Irish Pub",
    area: "Centro",
    capacity: 60,
    source: "docs/venue_candidates_malaga.md",
  },
  {
    city: "Malaga",
    name: "Le Grand Cafe Centro",
    area: "Centro",
    capacity: 60,
    source: "docs/venue_candidates_malaga.md",
  },
  {
    city: "Malaga",
    name: "Bartola Brunch & Bistro",
    area: "Centro",
    capacity: 40,
    source: "docs/venue_candidates_malaga.md",
  },
  {
    city: "Malaga",
    name: "The Museum Pub Irlandes",
    area: "Centro",
    capacity: 50,
    source: "docs/venue_candidates_malaga.md",
  },
  {
    city: "Malaga",
    name: "Espacio Bohemia",
    area: "Huelin",
    capacity: 60,
    source: "docs/venue_candidates_malaga.md",
  },
  {
    city: "Malaga",
    name: "Centro Cultural La Llave",
    area: "Huelin",
    capacity: 80,
    source: "docs/venue_candidates_malaga.md",
  },
  {
    city: "Malaga",
    name: "Play Planet Coffee & Shop",
    area: "Teatinos",
    capacity: 40,
    source: "docs/venue_candidates_malaga.md",
  },
  {
    city: "Malaga",
    name: "Rock and Reel",
    area: "Torremolinos",
    capacity: 50,
    source: "docs/venue_candidates_malaga.md",
  },
  {
    city: "Malaga",
    name: "Omar's Coffee Bar",
    capacity: 30,
    source: "docs/venue_candidates_malaga.md",
  },
  {
    city: "Malaga",
    name: "Antonio Martin Restaurante",
    area: "Gibralfaro",
    capacity: 60,
    source: "docs/venue_candidates_malaga.md",
  },
  // Tier 2 independents
  {
    city: "Malaga",
    name: "Recyclo Bike Cafe",
    area: "Centro",
    capacity: 30,
    source: "docs/venue_candidates_malaga.md",
  },
  {
    city: "Malaga",
    name: "La Madriguera",
    area: "Centro",
    capacity: 40,
    source: "docs/venue_candidates_malaga.md",
  },
  {
    city: "Malaga",
    name: "Pub Camden Lock",
    area: "Centro",
    capacity: 40,
    source: "docs/venue_candidates_malaga.md",
  },
  {
    city: "Malaga",
    name: "Kima Coffee",
    area: "Centro",
    capacity: 25,
    source: "docs/venue_candidates_malaga.md",
  },
  {
    city: "Malaga",
    name: "Santa Coffee",
    area: "Centro",
    capacity: 25,
    source: "docs/venue_candidates_malaga.md",
  },
  {
    city: "Malaga",
    name: "Q Pro Quo Coffee Library",
    area: "Centro",
    capacity: 25,
    source: "docs/venue_candidates_malaga.md",
  },
  {
    city: "Malaga",
    name: "Los Patios de Beatas",
    area: "Centro",
    capacity: 60,
    priceBand: "high",
    source: "docs/venue_candidates_malaga.md",
  },
  {
    city: "Malaga",
    name: "Cafeteria El Brillante",
    area: "Huelin",
    capacity: 30,
    source: "docs/venue_candidates_malaga.md",
  },
  {
    city: "Malaga",
    name: "Niage Garage",
    area: "Perchel",
    capacity: 40,
    source: "docs/venue_candidates_malaga.md",
  },
];
