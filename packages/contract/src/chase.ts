/**
 * Chase row state machine. Single source of truth for row.status across the
 * board UI, the engine (Stage 2 SFM), and the API surface. States mirror the
 * plan's SFM: intake -> outreach -> await -> parse -> validate -> update ->
 * notify, with a blocked terminal state for rows that cannot proceed.
 */
import * as v from "valibot";

export const CHASE_ROW_STATES = [
  /** Curated by the agent, waiting for the user to approve the shortlist. */
  "candidate",
  "intake",
  "outreach",
  "awaiting_reply",
  "parsing",
  "validating",
  "updating",
  "notifying",
  "chasing",
  "replied",
  "blocked",
  "done",
] as const;

export const chaseRowStateSchema = v.picklist(CHASE_ROW_STATES);
export type ChaseRowState = v.InferOutput<typeof chaseRowStateSchema>;

/** Board status buckets (screens/board.md [status] chips). */
export const BOARD_STATUS = ["chasing", "replied", "blocked", "done"] as const;
export const boardStatusSchema = v.picklist(BOARD_STATUS);
export type BoardStatus = v.InferOutput<typeof boardStatusSchema>;

/** Outreach channels (board filter: channel=email|telegram). */
export const CHANNELS = ["email", "telegram", "manual"] as const;
export const channelSchema = v.picklist(CHANNELS);
export type Channel = v.InferOutput<typeof channelSchema>;
