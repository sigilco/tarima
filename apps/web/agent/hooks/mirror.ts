/**
 * The eve hook-mirror (plan D13/D8): every durable session fact lands in
 * OUR SQLite (`agent_events`), and approval interactions are mirrored
 * into `approvals` for the audit tab. eve owns the approval gate; this
 * file only records what happened.
 *
 * Facts are keyed by their stream position (`line`, `index`) and
 * inserted with ON CONFLICT DO NOTHING, so a retried hook step is a
 * no-op. Progress records (`content.delta`, `call.progress`,
 * `call.input`, `call.started`) are skipped: they are not facts.
 *
 * A throwing hook handler FAILS THE TURN (see eve's `defineHook`
 * docstring), so every handler is total — the delegates in
 * `lib/mirror.ts` catch and log to stderr.
 */
import { defineHook } from "eve/hooks";
import {
  mirrorFact,
  mirrorInteractionOpened,
  mirrorInteractionSettled,
  rememberCall,
} from "../lib/mirror";

const MIRRORED_FACTS = new Set([
  "call.requested",
  "call.settled",
  "interaction.opened",
  "interaction.settled",
  "turn.started",
  "turn.settled",
  "task.started",
  "task.ended",
  "response.submitted",
  "response.settled",
  "session.started",
  "session.ended",
  "model.requested",
  "model.settled",
  "usage.recorded",
]);

export default defineHook({
  events: {
    "call.requested": (event, ctx) => {
      rememberCall(event.data);
      if (MIRRORED_FACTS.has(event.type)) mirrorFact(event, ctx);
    },
    "interaction.opened": (event, ctx) => {
      mirrorFact(event, ctx);
      mirrorInteractionOpened(event.data, ctx);
    },
    "interaction.settled": (event, ctx) => {
      mirrorFact(event, ctx);
      mirrorInteractionSettled(event.data, ctx);
    },
    "*": (event, ctx) => {
      if (!MIRRORED_FACTS.has(event.type)) return;
      mirrorFact(event, ctx);
    },
  },
});
