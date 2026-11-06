import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { extractJsonLdContact } from "./jsonld";
import { extractNap } from "./nap";
import { extractPageContact } from "./index";

const FIX = join(import.meta.dirname, "..", "fixtures", "enrich");
const fixture = (name: string) => readFileSync(join(FIX, name), "utf8");

describe("extractJsonLdContact", () => {
  it("reads a WordPress LocalBusiness/Restaurant JSON-LD block", () => {
    const c = extractJsonLdContact(fixture("wp-jsonld.html"));
    expect(c).not.toBeNull();
    expect(c!.name).toBe("Verde Taqueria");
    expect(c!.telephone).toBe("(510) 555-0142");
    expect(c!.email).toBe("events@verdetaco.example");
    expect(c!.priceRange).toBe("$$");
    expect(c!.address).toContain("1200 University Ave");
    expect(c!.openingHours).toContain("Mo-Th 11:00-22:00");
  });

  it("returns null on a page with no JSON-LD", () => {
    expect(extractJsonLdContact(fixture("bare-tel-mailto.html"))).toBeNull();
    expect(extractJsonLdContact("# just markdown\n")).toBeNull();
  });

  it("skips a malformed JSON-LD block without throwing", () => {
    const html = `<script type="application/ld+json">{not json</script>`;
    expect(extractJsonLdContact(html)).toBeNull();
  });
});

describe("extractNap", () => {
  it("finds tel: and mailto: links in bare HTML", () => {
    const nap = extractNap(fixture("bare-tel-mailto.html"));
    expect(nap.mailtoEmails).toContain("hello@backroom.example");
    expect(nap.telPhones.join(" ")).toContain("510");
  });

  it("finds contacts in readability markdown", () => {
    const nap = extractNap(fixture("cauce-markdown-contact.md"));
    expect(nap.emails).toContain("bookings@studiokilo.example");
    expect(nap.phones.join(" ")).toContain("555-0164");
  });
});

describe("extractPageContact", () => {
  it("prefers JSON-LD fields with jsonld provenance", () => {
    const c = extractPageContact(fixture("wp-jsonld.html"));
    expect(c.email).toEqual({ value: "events@verdetaco.example", source: "jsonld" });
    expect(c.phone).toEqual({ value: "(510) 555-0142", source: "jsonld" });
    expect(c.openingHours).toBeDefined();
  });

  it("falls back to mailto/tel links with link provenance", () => {
    const c = extractPageContact(fixture("bare-tel-mailto.html"));
    expect(c.email?.source).toBe("mailto");
    expect(c.email?.value).toBe("hello@backroom.example");
    expect(c.phone?.source).toBe("tel");
  });

  it("marks bare page-text matches as page_text", () => {
    const c = extractPageContact(fixture("cauce-markdown-contact.md"));
    expect(c.email?.source).toBe("page_text");
    expect(c.phone?.source).toBe("page_text");
  });

  it("returns an empty contact for a page with none", () => {
    const c = extractPageContact(fixture("cauce-markdown-empty.md"));
    expect(c.email).toBeUndefined();
    expect(c.phone).toBeUndefined();
  });
});
