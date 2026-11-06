#!/usr/bin/env node
/**
 * Offline place-search eval. Deterministic checks only (no LLM judge):
 * radius, schema, dedup, contact honesty. Replays recorded fixtures.
 */
import { mkdtempSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import * as v from "valibot";
import { catalogVenueSchema } from "@tarima/contract";

const here = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(here, "../../..");
const dir = mkdtempSync(join(tmpdir(), "tarima-eval-place-"));
process.env.DATABASE_URL = join(dir, "eval.db");
process.env.GEOAPIFY_API_KEY = "eval-fixture-key";

const { fixtureFetch } = await import("../src/services/place-fixtures");
const { searchVenues, setVenueSearchDeps } = await import("../src/services/venue-search");
const { haversineM, normalizeName } = await import("../src/services/geo");

type Golden = {
  id: string;
  q: string;
  city: string;
  category?: string;
  must: { radius_m: number; category_any?: string[] };
  expect: { min_results: number };
};

const lines = readFileSync(resolve(ROOT, "evals/place/golden-venues.jsonl"), "utf8")
  .trim()
  .split("\n")
  .filter((l) => l && !l.startsWith("#"));
const goldens: Golden[] = lines.map((l) => JSON.parse(l) as Golden);

const { fetch } = fixtureFetch();
setVenueSearchDeps({ fetch, geoapifyKey: "eval-fixture-key" });

let failed = 0;
for (const g of goldens) {
  const errors: string[] = [];
  const out = await searchVenues({
    city: g.city,
    query: g.q,
    category: g.category,
    radiusM: g.must.radius_m,
  });
  if (out.venues.length < g.expect.min_results) {
    errors.push(`min_results ${out.venues.length} < ${g.expect.min_results}`);
  }
  const seenExt = new Set<string>();
  for (let i = 0; i < out.venues.length; i++) {
    const row = out.venues[i];
    const parsed = v.safeParse(catalogVenueSchema, row);
    if (!parsed.success) errors.push(`schema ${row.name}: ${JSON.stringify(parsed.issues)}`);
    if (row.latitude != null && row.longitude != null) {
      if ((row.distanceM ?? Infinity) > g.must.radius_m) {
        errors.push(`radius ${row.name} ${row.distanceM} > ${g.must.radius_m}`);
      }
    }
    if (row.contactEmail || row.contactPhone) {
      if (!row.contactSource) errors.push(`contact without provenance: ${row.name}`);
    }
    if (row.externalId) {
      if (seenExt.has(row.externalId)) errors.push(`dup external ${row.externalId}`);
      seenExt.add(row.externalId);
    }
    for (let j = i + 1; j < out.venues.length; j++) {
      const other = out.venues[j];
      if (
        normalizeName(row.name) === normalizeName(other.name) &&
        row.latitude != null &&
        other.latitude != null &&
        haversineM(
          { lat: row.latitude, lon: row.longitude as number },
          { lat: other.latitude, lon: other.longitude as number },
        ) < 50
      ) {
        errors.push(`dup name+50m ${row.name}`);
      }
    }
  }
  if (errors.length) {
    failed += 1;
    console.error(`FAIL ${g.id} ${g.q}`);
    for (const e of errors) console.error(`  ${e}`);
  } else {
    console.log(`ok ${g.id} n=${out.venues.length} cache=${out.cache}`);
  }
}

console.log(`eval:offline ${goldens.length - failed}/${goldens.length} passed (root ${ROOT})`);
if (failed) process.exit(1);
