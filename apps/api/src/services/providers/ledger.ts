/**
 * Shared per-provider daily ledger over the `provider_ledger` table
 * (migration 0010). One row per (day, provider, bucket); `used` counts
 * calls for most providers and cents for `llm_extract_cents`.
 *
 * The day boundary is America/Los_Angeles, not UTC: Google Maps
 * quotas reset at midnight Pacific and the plan's spend ledgers follow
 * the same convention, so a UTC reset would double-spend the last
 * hours of the Pacific day.
 */
import { and, eq } from "drizzle-orm";
import { providerLedger } from "../../db/schema";
import type { ApiDb } from "../projects";

const DAY_FORMAT = new Intl.DateTimeFormat("en-US", {
  timeZone: "America/Los_Angeles",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

/** YYYY-MM-DD of `now` in America/Los_Angeles. */
export function ledgerDay(now: Date = new Date()): string {
  const parts = DAY_FORMAT.formatToParts(now);
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "";
  return `${get("year")}-${get("month")}-${get("day")}`;
}

/** Current `used` for (provider, bucket) today, Pacific. */
export function ledgerGet(
  db: ApiDb,
  provider: string,
  bucket: string,
  now: Date = new Date(),
): number {
  const row = db
    .select({ used: providerLedger.used })
    .from(providerLedger)
    .where(
      and(
        eq(providerLedger.day, ledgerDay(now)),
        eq(providerLedger.provider, provider),
        eq(providerLedger.bucket, bucket),
      ),
    )
    .get();
  return row?.used ?? 0;
}

/** Add `delta` to (provider, bucket) today, Pacific. Returns the new total. */
export function ledgerAdd(
  db: ApiDb,
  provider: string,
  bucket: string,
  delta: number,
  now: Date = new Date(),
): number {
  const day = ledgerDay(now);
  const existing = db
    .select({ used: providerLedger.used })
    .from(providerLedger)
    .where(
      and(
        eq(providerLedger.day, day),
        eq(providerLedger.provider, provider),
        eq(providerLedger.bucket, bucket),
      ),
    )
    .get();
  const used = (existing?.used ?? 0) + delta;
  db.insert(providerLedger)
    .values({ day, provider, bucket, used })
    .onConflictDoUpdate({
      target: [providerLedger.day, providerLedger.provider, providerLedger.bucket],
      set: { used },
    })
    .run();
  return used;
}
