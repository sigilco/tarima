/**
 * Status bridge between the two row-state vocabularies.
 *
 * - The contract (`@tarima/contract` chaseRowStateSchema) is the public wire
 *   surface: intake, outreach, awaiting_reply, parsing, validating, updating,
 *   notifying, chasing, replied, blocked, done.
 * - The database (`entityStatuses` in the drizzle schema) is the internal
 *   engine vocabulary: pending, intake, chasing, await_reply, parsed,
 *   validated, updated, notified, done, failed.
 *
 * Both stay intact: the contract is a published surface and the db enum
 * tracks the engine's own progression. This module is the single explicit
 * translation point, so a state can never silently drift between the two.
 */
import { CHASE_ROW_STATES, type ChaseRowState } from "@tarima/contract";
import { entityStatuses, type EntityStatus } from "../db/schema";

/** Wire state -> database state. */
const TO_DB: Record<ChaseRowState, EntityStatus> = {
  candidate: "candidate",
  intake: "intake",
  outreach: "chasing",
  awaiting_reply: "await_reply",
  parsing: "parsed",
  validating: "validated",
  updating: "updated",
  notifying: "notified",
  chasing: "chasing",
  replied: "parsed",
  blocked: "failed",
  done: "done",
};

/** Database state -> wire state. The inverse of TO_DB, chosen deterministically
 *  when several wire states collapse onto one db state. */
const TO_WIRE: Record<EntityStatus, ChaseRowState> = {
  candidate: "candidate",
  pending: "intake",
  intake: "intake",
  chasing: "chasing",
  await_reply: "awaiting_reply",
  parsed: "replied",
  validated: "validating",
  updated: "updating",
  notified: "notifying",
  done: "done",
  failed: "blocked",
};

/** Translate a wire (contract) status into the database status. */
export function toDbStatus(status: ChaseRowState): EntityStatus {
  return TO_DB[status];
}

/**
 * Translate a database status into the wire (contract) status. Unknown
 * values (a row written by a newer build) degrade to "intake" rather than
 * throwing: the board still renders something sane.
 */
export function toWireStatus(status: EntityStatus | string): ChaseRowState {
  return TO_WIRE[status as EntityStatus] ?? "intake";
}

/** Every wire state, in the contract's declaration order. */
export function wireStatuses(): ChaseRowState[] {
  return [...CHASE_ROW_STATES];
}

/** Every database status, in the schema's declaration order. */
export function dbStatuses(): EntityStatus[] {
  return [...entityStatuses];
}
