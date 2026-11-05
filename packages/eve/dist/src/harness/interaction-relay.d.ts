import type { RelayedInteractionEvent } from "#channel/types.js";
import type { SessionEvent } from "#protocol/session-event.js";
import type { SessionView } from "#protocol/session-projection/tables.js";
/**
 * What this session relays for one of its own facts. A commit's requests relay together, as one
 * prompt: the first `interaction.opened` of a commit relays every request it opened, and the
 * rest relay nothing. An opened request names its origin: this session, its interaction, and
 * the call it asks about, which may be a call of a session this one serves in turn.
 */
export declare function relayedInteractionEvents(view: SessionView, event: SessionEvent, sessionId: string): readonly RelayedInteractionEvent[];
