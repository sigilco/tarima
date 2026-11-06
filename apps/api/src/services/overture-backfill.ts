import { honestContact } from "./providers/honest-contact";
import type { PlaceHit } from "./providers/types";
import { upsertHits } from "./venue-search";

export type OvertureCsvRow = {
  id: string;
  name: string;
  city: string;
  lat: string;
  lon: string;
  phone?: string;
  email?: string;
  website?: string;
  operating_status?: string;
};

export function parseOvertureCsv(text: string): OvertureCsvRow[] {
  const lines = text.trim().split(/\r?\n/);
  if (lines.length < 2) return [];
  const header = lines[0].split(",").map((h) => h.trim());
  const idx = (name: string) => header.indexOf(name);
  const rows: OvertureCsvRow[] = [];
  for (const line of lines.slice(1)) {
    const cols = splitCsv(line);
    rows.push({
      id: cols[idx("id")] ?? "",
      name: cols[idx("name")] ?? "",
      city: cols[idx("city")] ?? "",
      lat: cols[idx("lat")] ?? "",
      lon: cols[idx("lon")] ?? "",
      phone: cols[idx("phone")],
      email: cols[idx("email")],
      website: cols[idx("website")],
      operating_status: cols[idx("operating_status")],
    });
  }
  return rows;
}

function splitCsv(line: string): string[] {
  const out: string[] = [];
  let cur = "";
  let quoted = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      quoted = !quoted;
      continue;
    }
    if (ch === "," && !quoted) {
      out.push(cur);
      cur = "";
      continue;
    }
    cur += ch;
  }
  out.push(cur);
  return out;
}

export function overtureRowsToHits(rows: OvertureCsvRow[]): PlaceHit[] {
  const hits: PlaceHit[] = [];
  for (const row of rows) {
    const status = (row.operating_status ?? "").toLowerCase();
    if (status.includes("closed") || status === "permanently_closed") continue;
    const name = row.name.trim();
    const lat = Number.parseFloat(row.lat);
    const lon = Number.parseFloat(row.lon);
    if (!name || !Number.isFinite(lat) || !Number.isFinite(lon)) continue;
    const contact = honestContact({
      email: row.email,
      phone: row.phone,
      website: row.website,
      source: "overture",
    });
    hits.push({
      externalId: `overture/${row.id}`,
      name,
      city: row.city.trim() || "unknown",
      latitude: lat,
      longitude: lon,
      website: contact.website,
      contactEmail: contact.email,
      contactPhone: contact.phone,
      provider: "overture",
      contactSource: contact.source,
    });
  }
  return hits;
}

export function backfillOvertureCsv(text: string, now = Date.now()): { inserted: number } {
  const hits = overtureRowsToHits(parseOvertureCsv(text));
  const ids = upsertHits(hits, now);
  return { inserted: ids.length };
}
