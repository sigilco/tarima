/**
 * Fixture data for the demo surfaces: the phone-screen preview variations
 * (Cosmos) and the /demo route. Pure data, no API calls; rows are typed as
 * the real board wire shape so `lib/board.ts` runs over them unchanged.
 *
 * Timestamps are derived from `Date.now()` at import time so
 * `relativeTime()` looks alive on every load.
 */
import type { Channel, ChaseRowState } from "@tarima/contract";
import type { BoardRow } from "./board.js";

const now = Date.now();
/** ISO timestamp `minutes` before load time. */
const ago = (minutes: number) => new Date(now - minutes * 60_000).toISOString();

/** The demo project the fixture rows belong to. */
export const DEMO_PROJECT = {
  id: "a3f1c2d4-e5b6-4789-9a01-2b3c4d5e6f70",
  name: "Summit 2026",
  createdAt: ago(60 * 24 * 9),
} as const;

function row(
  id: string,
  name: string,
  status: ChaseRowState,
  missing: string[],
  createdAgoMin: number,
  updatedAgoMin: number,
  contact?: string,
  channel?: Channel,
): BoardRow {
  return {
    id,
    projectId: DEMO_PROJECT.id,
    name,
    contact,
    channel,
    status,
    missing,
    createdAt: ago(createdAgoMin),
    updatedAt: ago(updatedAgoMin),
  };
}

/**
 * ~8 rows across buckets: two queued agent tasks (chasing), one live call
 * (chasing/notifying), one agent-drafted email awaiting approval
 * (chasing/validating), one blocked, two replied, two done.
 */
export const DEMO_ROWS: BoardRow[] = [
  row(
    "row-harbourview",
    "Harbourview Hall",
    "validating",
    ["private room for 25", "AV package"],
    60 * 24 * 4,
    12,
    "events@harbourviewhall.com",
    "email",
  ),
  row(
    "row-northwind",
    "Northwind Coffee",
    "notifying",
    ["sponsorship tier quote"],
    60 * 24 * 4,
    2,
    "partnerships@northwindcoffee.co",
    "email",
  ),
  row(
    "row-bistrot-lea",
    "Bistrot Léa",
    "awaiting_reply",
    ["set-menu pricing"],
    60 * 24 * 3,
    60 * 20,
    "+33 1 45 22 18 04",
    "telegram",
  ),
  row(
    "row-quayside",
    "Quayside Studios",
    "blocked",
    ["loading dock access"],
    60 * 24 * 5,
    60 * 30,
    "hello@quaysidestudios.io",
    "email",
  ),
  row(
    "row-lumendrinks",
    "Lumen Drinks Co.",
    "replied",
    [],
    60 * 24 * 6,
    60 * 8,
    "sales@lumendrinks.com",
    "email",
  ),
  row(
    "row-inkpress",
    "Ink & Press Print",
    "replied",
    [],
    60 * 24 * 6,
    60 * 26,
    "jobs@inkandpress.fr",
    "telegram",
  ),
  row(
    "row-cedarfork",
    "Cedar Fork Catering",
    "done",
    [],
    60 * 24 * 7,
    60 * 40,
    "bookings@cedarfork.com",
    "email",
  ),
  row(
    "row-atlasav",
    "Atlas AV Rentals",
    "done",
    [],
    60 * 24 * 7,
    60 * 48,
    "rentals@atlasav.co",
    "email",
  ),
];
