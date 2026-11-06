import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterAll, describe, expect, it } from "vitest";

// The database url must be set BEFORE the db module is imported: the
// api opens the sqlite file at import time.
const dir = mkdtempSync(join(tmpdir(), "tarima-gtm-svc-"));
process.env.DATABASE_URL = join(dir, "test.db");
process.env.NODE_ENV = "test";

const { db } = await import("../db");
const { isGtmSuppressed, listGtmContacts, setGtmConsent, setGtmDoNotContact, upsertGtmContact } =
  await import("./gtm-contacts");

afterAll(() => rmSync(dir, { recursive: true, force: true }));

describe("gtm contacts service", () => {
  it("upserts by lower-cased email and keeps one row", () => {
    const first = upsertGtmContact(db, {
      email: "Ana@Example.com",
      name: "Ana",
      source: "tally",
    });
    expect(first.email).toBe("ana@example.com");
    expect(first.consent).toBe(false);
    expect(first.doNotContact).toBe(false);

    const second = upsertGtmContact(db, {
      email: "ana@example.com",
      name: "Ana K",
      consent: true,
    });
    expect(second.id).toBe(first.id);
    expect(second.name).toBe("Ana K");
    expect(second.consent).toBe(true);
    expect(second.source).toBe("tally");
    expect(listGtmContacts(db).filter((c) => c.email === "ana@example.com")).toHaveLength(1);
  });

  it("suppression is never cleared by an upsert", () => {
    upsertGtmContact(db, { email: "stop@example.com" });
    setGtmDoNotContact(db, "stop@example.com", true, "asked to stop");
    expect(isGtmSuppressed(db, "STOP@example.com")).toBe(true);

    const after = upsertGtmContact(db, { email: "stop@example.com", consent: true });
    expect(after.doNotContact).toBe(true);
    expect(after.doNotContactReason).toBe("asked to stop");
    expect(isGtmSuppressed(db, "stop@example.com")).toBe(true);
  });

  it("lifts suppression only through setGtmDoNotContact", () => {
    const lifted = setGtmDoNotContact(db, "stop@example.com", false);
    expect(lifted.doNotContact).toBe(false);
    expect(lifted.doNotContactReason).toBeUndefined();
    expect(isGtmSuppressed(db, "stop@example.com")).toBe(false);
  });

  it("setGtmConsent creates the row when missing", () => {
    const contact = setGtmConsent(db, "new@example.com", true);
    expect(contact.consent).toBe(true);
    expect(contact.source).toBe("manual");
    expect(isGtmSuppressed(db, "new@example.com")).toBe(false);
  });

  it("unknown emails are not suppressed", () => {
    expect(isGtmSuppressed(db, "nobody@example.com")).toBe(false);
  });
});
