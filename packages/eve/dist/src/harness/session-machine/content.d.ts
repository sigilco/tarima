import type { Commit } from "#harness/types.js";
import type { FactOf } from "#protocol/session-events/facts.js";
/** Parts of a run's content that completed together, as one commit. */
export declare function completeParts(parts: readonly FactOf<"content.completed">["data"][]): Commit;
