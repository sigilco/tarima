/**
 * JSON-LD (schema.org LocalBusiness & friends) extraction.
 *
 * JSON-LD is published by the business for machines — the cleanest
 * contact source in the tier-2 constitution (tarima-search-plan §1.3).
 * Input is expected to be HTML; markdown input simply yields no blocks.
 */

export interface JsonLdContact {
  name?: string;
  telephone?: string;
  email?: string;
  url?: string;
  /** schema.org openingHours text values, e.g. "Mo-Fr 11:00-22:00". */
  openingHours?: string[];
  address?: string;
  priceRange?: string;
}

const LD_RE = /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;

/** Every JSON-LD block in the HTML, parsed; unparseable blocks skipped. */
export function extractJsonLdBlocks(html: string): unknown[] {
  const blocks: unknown[] = [];
  for (const m of html.matchAll(LD_RE)) {
    const raw = m[1]?.trim();
    if (!raw) continue;
    try {
      blocks.push(JSON.parse(raw));
    } catch {
      // A malformed block must not sink the page.
    }
  }
  return blocks;
}

const BUSINESS_TYPES = new Set([
  "localbusiness",
  "restaurant",
  "foodestablishment",
  "barorpub",
  "cafeorcoffeeshop",
  "nightclub",
  "eventvenue",
  "musicvenue",
  "performingarts theater",
  "store",
  "organization",
]);

function isBusinessType(type: unknown): boolean {
  if (typeof type !== "string") return false;
  const t = type.toLowerCase().replace(/\s+/g, "");
  for (const b of BUSINESS_TYPES) {
    if (t === b || t.endsWith(`.${b}`) || t.includes(b)) return true;
  }
  return false;
}

function asRecord(v: unknown): Record<string, unknown> | undefined {
  return v && typeof v === "object" && !Array.isArray(v)
    ? (v as Record<string, unknown>)
    : undefined;
}

function* walkNodes(node: unknown): Generator<Record<string, unknown>> {
  if (Array.isArray(node)) {
    for (const item of node) yield* walkNodes(item);
    return;
  }
  const rec = asRecord(node);
  if (!rec) return;
  yield rec;
  if (Array.isArray(rec["@graph"])) {
    for (const item of rec["@graph"]) yield* walkNodes(item);
  }
}

function firstString(v: unknown): string | undefined {
  if (typeof v === "string" && v.trim()) return v.trim();
  if (Array.isArray(v)) {
    for (const item of v) {
      const s = firstString(item);
      if (s) return s;
    }
  }
  return undefined;
}

function addressText(v: unknown): string | undefined {
  const rec = asRecord(v);
  if (!rec) return firstString(v);
  const parts = [
    firstString(rec.streetAddress),
    firstString(rec.addressLocality),
    firstString(rec.addressRegion),
    firstString(rec.postalCode),
  ].filter(Boolean);
  return parts.length ? parts.join(", ") : undefined;
}

function openingHoursList(v: unknown): string[] | undefined {
  if (typeof v === "string" && v.trim()) return [v.trim()];
  if (Array.isArray(v)) {
    const out = v
      .map((h) => (typeof h === "string" ? h.trim() : undefined))
      .filter((h): h is string => Boolean(h));
    return out.length ? out : undefined;
  }
  return undefined;
}

/**
 * First business-ish JSON-LD node's contact fields. Returns null when
 * the page carries no usable block — callers fall through to NAP.
 */
export function extractJsonLdContact(html: string): JsonLdContact | null {
  for (const block of extractJsonLdBlocks(html)) {
    for (const node of walkNodes(block)) {
      const type = node["@type"];
      const types = Array.isArray(type) ? type : [type];
      if (!types.some(isBusinessType)) continue;
      const contact: JsonLdContact = {};
      const name = firstString(node.name);
      if (name) contact.name = name;
      const tel = firstString(node.telephone);
      if (tel) contact.telephone = tel;
      const email = firstString(node.email);
      if (email) contact.email = email;
      const url = firstString(node.url);
      if (url) contact.url = url;
      const hours =
        openingHoursList(node.openingHours) ?? openingHoursList(node.openingHoursSpecification);
      if (hours) contact.openingHours = hours;
      const addr = addressText(node.address);
      if (addr) contact.address = addr;
      const pr = firstString(node.priceRange);
      if (pr) contact.priceRange = pr;
      return contact;
    }
  }
  return null;
}
