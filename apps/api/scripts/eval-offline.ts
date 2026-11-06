#!/usr/bin/env node
/**
 * Offline place-search eval. Deterministic checks only (no LLM judge):
 * radius, schema, dedup, contact honesty — plus the search-wire KPIs
 * from tarima-search-plan §3.2:
 *   - tier-0 cache hit rate on the second (identical) pass  >= 0.40
 *   - coverage: rows with a verified contact / rows             >= 0.30
 *   - paid calls per query (Google Places / Foursquare)         cost <= $0.002
 * Every provider call replays recorded fixtures; nothing touches
 * the network. Paid providers are disabled in this eval (env:{}),
 * which is exactly the "Google tier off" acceptance scenario.
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

const noSleep = () => Promise.resolve();
const deps = { geoapifyKey: "eval-fixture-key", env: {} as NodeJS.ProcessEnv, sleep: noSleep };

// Paid providers: Google Places ($32/1k Pro text search) and
// Foursquare ($15/1k Pro). Geoapify/Photon/Overpass/cauce are free-tier
// or self-hosted and do not count against the $0.002/query budget.
const PAID_USD: [string, number][] = [
  ["places.googleapis.com", 0.032],
  ["places-api.foursquare.com", 0.015],
];
function paidStats(calls: string[]): { calls: number; usd: number } {
  let n = 0;
  let usd = 0;
  for (const c of calls) {
    for (const [host, price] of PAID_USD) {
      if (c.includes(host)) {
        n += 1;
        usd += price;
        break;
      }
    }
  }
  return { calls: n, usd };
}

let failed = 0;
let warmHits = 0;
let totalRows = 0;
let contactRows = 0;
let phoneRows = 0;
let websiteRows = 0;
let paidCalls = 0;
let paidUsd = 0;
const kpiFailures: string[] = [];

for (const g of goldens) {
  const errors: string[] = [];

  // Cold pass: fresh fixture fetch, providers live (fixture replay).
  const cold = fixtureFetch();
  setVenueSearchDeps({ ...deps, fetch: cold.fetch });
  const out = await searchVenues({
    city: g.city,
    query: g.q,
    category: g.category,
    radiusM: g.must.radius_m,
  });
  if (out.cache !== "miss") errors.push(`cold pass cache=${out.cache}`);

  // Warm pass: identical query must be a tier-0 hit with ZERO fetches.
  const warm = fixtureFetch();
  setVenueSearchDeps({ ...deps, fetch: warm.fetch });
  const again = await searchVenues({
    city: g.city,
    query: g.q,
    category: g.category,
    radiusM: g.must.radius_m,
  });
  if (again.cache === "hit") warmHits += 1;
  else errors.push(`warm pass cache=${again.cache}`);
  if (warm.calls.length !== 0) {
    errors.push(`warm pass made ${warm.calls.length} provider calls`);
  }

  const coldPaid = paidStats(cold.calls);
  const warmPaid = paidStats(warm.calls);
  paidCalls += coldPaid.calls + warmPaid.calls;
  paidUsd += coldPaid.usd + warmPaid.usd;

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
    if (row.contactEmail || row.contactPhone) contactRows += 1;
    if (row.contactPhone) phoneRows += 1;
    if (row.website) websiteRows += 1;
    totalRows += 1;
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

// --- KPI table (tarima-search-plan §3.2 thresholds) -----------------------
const n = goldens.length;
const hitRate = warmHits / n;
const coverage = totalRows === 0 ? 0 : contactRows / totalRows;
const phoneRate = totalRows === 0 ? 0 : phoneRows / totalRows;
const websiteRate = totalRows === 0 ? 0 : websiteRows / totalRows;
const paidPerQuery = paidCalls / n;
const usdPerQuery = paidUsd / n;

const HIT_MIN = 0.4; // plan §3.2: tier-0 cache hit rate >= 40% on session replay
const COVERAGE_MIN = 0.3; // rows with a verified contact (email|phone) / rows
const USD_MAX = 0.002; // plan §3.2: cost per cold query <= $0.002

const rows: [string, string, string, boolean][] = [
  ["cache_hit_rate_2nd_pass", hitRate.toFixed(3), `>= ${HIT_MIN}`, hitRate >= HIT_MIN],
  [
    "coverage_verified_contact",
    coverage.toFixed(3),
    `>= ${COVERAGE_MIN}`,
    coverage >= COVERAGE_MIN,
  ],
  ["phone_rate", phoneRate.toFixed(3), "info", true],
  ["website_rate", websiteRate.toFixed(3), "info", true],
  ["paid_calls_per_query", paidPerQuery.toFixed(3), "info", true],
  ["est_cost_usd_per_query", usdPerQuery.toFixed(4), `<= ${USD_MAX}`, usdPerQuery <= USD_MAX],
];
console.log("\nKPI                                   value   threshold  gate");
for (const [name, value, thr, ok] of rows) {
  console.log(`${name.padEnd(38)} ${value.padEnd(7)} ${thr.padEnd(10)} ${ok ? "ok" : "FAIL"}`);
  if (!ok) kpiFailures.push(name);
}

console.log(
  `eval:offline ${goldens.length - failed}/${goldens.length} passed, ` +
    `kpi ${rows.filter((r) => r[3]).length - 3}/${rows.length - 3} gated (root ${ROOT})`,
);
if (failed || kpiFailures.length) process.exit(1);
