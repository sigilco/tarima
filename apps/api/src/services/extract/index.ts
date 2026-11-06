/**
 * Page-contact extraction: combines JSON-LD (structured, published for
 * machines) with NAP signals (mailto:/tel: links and page text).
 *
 * Every returned field carries its provenance so the caller can stamp
 * `contact_source` honestly:
 *   jsonld    — schema.org block on the page
 *   mailto    — explicit mailto: link
 *   tel       — explicit tel: link
 *   page_text — bare email/phone pattern in page text
 *
 * The honest-contact rule (tarima-search-plan §1.4): a contact value
 * must literally appear on the venue's own page. This module only
 * reports what it found verbatim; it never constructs or guesses.
 */
import { extractJsonLdContact, type JsonLdContact } from "./jsonld";
import { extractNap } from "./nap";

export type ContactSource = "jsonld" | "mailto" | "tel" | "page_text";

export interface ExtractedField {
  value: string;
  source: ContactSource;
}

export interface ExtractedContact {
  email?: ExtractedField;
  phone?: ExtractedField;
  /** Non-contact enrichment, when present (no provenance needed). */
  name?: string;
  url?: string;
  openingHours?: string[];
  address?: string;
  priceRange?: string;
}

const looksLikeHtml = (s: string) => /<\/?(html|body|div|a|p|script|h[1-6])\b/i.test(s);

/**
 * Extract contact candidates from fetched page content. `source` may be
 * raw HTML or cauce readability markdown — markdown keeps `tel:` and
 * `mailto:` link targets, so NAP still works; JSON-LD only exists in
 * HTML (script blocks are stripped by readability extraction).
 */
export function extractPageContact(source: string): ExtractedContact {
  const out: ExtractedContact = {};

  const jsonld: JsonLdContact | null = looksLikeHtml(source) ? extractJsonLdContact(source) : null;
  if (jsonld) {
    if (jsonld.name) out.name = jsonld.name;
    if (jsonld.url) out.url = jsonld.url;
    if (jsonld.openingHours) out.openingHours = jsonld.openingHours;
    if (jsonld.address) out.address = jsonld.address;
    if (jsonld.priceRange) out.priceRange = jsonld.priceRange;
  }

  const nap = extractNap(source);

  // Email precedence: JSON-LD email > mailto: link > bare page text.
  if (jsonld?.email) {
    out.email = { value: jsonld.email, source: "jsonld" };
  } else if (nap.mailtoEmails[0]) {
    out.email = { value: nap.mailtoEmails[0], source: "mailto" };
  } else if (nap.emails[0]) {
    out.email = { value: nap.emails[0], source: "page_text" };
  }

  // Phone precedence: JSON-LD telephone > tel: link > bare page text.
  if (jsonld?.telephone) {
    out.phone = { value: jsonld.telephone, source: "jsonld" };
  } else if (nap.telPhones[0]) {
    out.phone = { value: nap.telPhones[0], source: "tel" };
  } else if (nap.phones[0]) {
    out.phone = { value: nap.phones[0], source: "page_text" };
  }

  return out;
}
