/**
 * Dev-time Overture Places backfill. Not run in CI.
 *
 * Preferred path: pass a CSV produced locally with DuckDB over the
 * public Overture S3 bucket, then:
 *
 *   pnpm --filter @tarima/api exec tsx scripts/backfill-overture.ts berkeley-overture.csv
 *
 * Permanently closed rows are skipped. contact_source is `overture`.
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { backfillOvertureCsv } from "../src/services/overture-backfill";

const file = process.argv[2];
if (!file) {
  console.error("usage: tsx scripts/backfill-overture.ts <overture.csv>");
  process.exit(2);
}
const text = readFileSync(resolve(file), "utf8");
const result = backfillOvertureCsv(text);
console.log(`overture backfill: ${result.inserted} rows`);
