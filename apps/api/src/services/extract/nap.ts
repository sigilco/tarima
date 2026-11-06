/**
 * NAP extraction: Name/Address/Phone signals in page text —
 * `tel:`/`mailto:` links (HTML hrefs and markdown links both reduce to
 * the same `tel:`/`mailto:` token) plus plain-text email and US phone
 * patterns.
 *
 * Everything returned here is `page_text` provenance: the value must
 * literally appear on the venue's own page (honest-contact rule —
 * tarima-search-plan §1.4). Callers must never accept a value this
 * module did not find verbatim in the source.
 */

export interface NapContact {
  /** mailto: targets and bare email addresses, deduped, in page order. */
  emails: string[];
  /** tel: targets and phone-shaped strings, deduped, in page order. */
  phones: string[];
  /** The subset of `emails` that came from explicit mailto: links. */
  mailtoEmails: string[];
  /** The subset of `phones` that came from explicit tel: links. */
  telPhones: string[];
}

const EMAIL_RE = /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g;
// US-ish phone: optional +1, area code in parens or bare, 3-3-4 digits.
const PHONE_RE = /(?:\+?1[\s.-]?)?\(?\d{3}\)?[\s.-]\d{3}[\s.-]\d{4}\b/g;
const TEL_LINK_RE = /tel:\+?[\d\s().-]{7,}/gi;
const MAILTO_LINK_RE = /mailto:([A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,})/gi;

function cleanPhone(raw: string): string {
  return raw.replace(/^tel:/i, "").trim();
}

function cleanEmail(raw: string): string {
  return raw
    .replace(/^mailto:/i, "")
    .split("?")[0]!
    .trim();
}

function dedupe<T>(items: T[]): T[] {
  return [...new Set(items)];
}

/**
 * Extract contact candidates from HTML or readability markdown.
 * Ordering: mailto/tel links first (explicit contact affordances),
 * then bare emails/phones in page order.
 */
export function extractNap(source: string): NapContact {
  const emails: string[] = [];
  const phones: string[] = [];
  const mailtoEmails: string[] = [];
  const telPhones: string[] = [];

  for (const m of source.matchAll(MAILTO_LINK_RE)) {
    if (m[1]) {
      const e = cleanEmail(m[1]);
      emails.push(e);
      mailtoEmails.push(e);
    }
  }
  for (const m of source.matchAll(TEL_LINK_RE)) {
    const p = cleanPhone(m[0]);
    phones.push(p);
    telPhones.push(p);
  }
  for (const m of source.matchAll(EMAIL_RE)) {
    emails.push(m[0]);
  }
  for (const m of source.matchAll(PHONE_RE)) {
    phones.push(m[0].trim());
  }

  return {
    emails: dedupe(emails),
    phones: dedupe(phones),
    mailtoEmails: dedupe(mailtoEmails),
    telPhones: dedupe(telPhones),
  };
}
