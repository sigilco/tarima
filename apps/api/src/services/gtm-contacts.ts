/**
 * GTM contacts service: the consent/suppression list for founder-led
 * outreach (contract `gtmContactSchema`, table `gtm_contacts`).
 *
 * One row per email, stored lower-cased. Two flags carry the compliance
 * weight:
 * - `consent`: recorded opt-in to outreach.
 * - `doNotContact`: suppression. Once set it is never cleared by an
 *   upsert — only `setGtmDoNotContact` lifts it, explicitly.
 *
 * No UI and no sender live here; this is the record other surfaces
 * check before anything goes out.
 */
import { randomUUID } from "node:crypto";
import { asc, eq } from "drizzle-orm";
import type { GtmContact, UpsertGtmContact } from "@tarima/contract";
import { gtmContacts, type GtmContactRow } from "../db/schema";
import { toIso, type ApiDb } from "./projects";

/** Normalise an email for storage and lookup. */
export function normalizeGtmEmail(email: string): string {
  return email.trim().toLowerCase();
}

function toWire(row: GtmContactRow): GtmContact {
  return {
    id: row.id,
    email: row.email,
    ...(row.name ? { name: row.name } : {}),
    source: row.source,
    consent: row.consent,
    doNotContact: row.doNotContact,
    ...(row.doNotContactReason !== null ? { doNotContactReason: row.doNotContactReason } : {}),
    ...(row.projectId !== null ? { projectId: row.projectId } : {}),
    ...(row.notes !== null ? { notes: row.notes } : {}),
    createdAt: toIso(row.createdAt),
    updatedAt: toIso(row.updatedAt),
  };
}

function findByEmail(db: ApiDb, email: string): GtmContactRow | undefined {
  return db.select().from(gtmContacts).where(eq(gtmContacts.email, email)).get();
}

/** Create or update the contact for an email. Suppression is preserved. */
export function upsertGtmContact(db: ApiDb, input: UpsertGtmContact): GtmContact {
  const email = normalizeGtmEmail(input.email);
  const current = findByEmail(db, email);
  const now = Date.now();

  if (!current) {
    const row: GtmContactRow = {
      id: randomUUID(),
      email,
      name: input.name ?? null,
      source: input.source ?? "manual",
      consent: input.consent ?? false,
      doNotContact: false,
      doNotContactReason: null,
      projectId: input.projectId ?? null,
      notes: input.notes ?? null,
      createdAt: now,
      updatedAt: now,
    };
    db.insert(gtmContacts).values(row).run();
    return toWire(row);
  }

  db.update(gtmContacts)
    .set({
      name: input.name ?? current.name,
      source: input.source ?? current.source,
      consent: input.consent ?? current.consent,
      projectId: input.projectId !== undefined ? input.projectId : current.projectId,
      notes: input.notes !== undefined ? input.notes : current.notes,
      updatedAt: now,
    })
    .where(eq(gtmContacts.id, current.id))
    .run();
  return toWire(findByEmail(db, email)!);
}

/** Record (or withdraw) consent for a contact, creating the row if needed. */
export function setGtmConsent(db: ApiDb, email: string, consent: boolean): GtmContact {
  const normalized = normalizeGtmEmail(email);
  if (!findByEmail(db, normalized)) {
    upsertGtmContact(db, { email: normalized, consent });
  } else {
    db.update(gtmContacts)
      .set({ consent, updatedAt: Date.now() })
      .where(eq(gtmContacts.email, normalized))
      .run();
  }
  return toWire(findByEmail(db, normalized)!);
}

/**
 * Set or lift suppression. Setting it records the reason and timestamp
 * is implicit in `updatedAt`; lifting it clears the reason too.
 */
export function setGtmDoNotContact(
  db: ApiDb,
  email: string,
  doNotContact: boolean,
  reason?: string | null,
): GtmContact {
  const normalized = normalizeGtmEmail(email);
  if (!findByEmail(db, normalized)) {
    upsertGtmContact(db, { email: normalized });
  }
  db.update(gtmContacts)
    .set({
      doNotContact,
      doNotContactReason: doNotContact ? (reason ?? null) : null,
      updatedAt: Date.now(),
    })
    .where(eq(gtmContacts.email, normalized))
    .run();
  return toWire(findByEmail(db, normalized)!);
}

/** Every contact, oldest first. */
export function listGtmContacts(db: ApiDb): GtmContact[] {
  return db
    .select()
    .from(gtmContacts)
    .orderBy(asc(gtmContacts.createdAt), asc(gtmContacts.id))
    .all()
    .map(toWire);
}

/**
 * The suppression check every outbound path runs first: true when the
 * email is on the do-not-contact list. Unknown emails are NOT suppressed
 * — absence of a row means "not yet recorded", which is a consent
 * question, not a suppression one.
 */
export function isGtmSuppressed(db: ApiDb, email: string): boolean {
  const row = findByEmail(db, normalizeGtmEmail(email));
  return row?.doNotContact ?? false;
}
