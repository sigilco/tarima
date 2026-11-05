import type { SessionAuthContext } from "#channel/types.js";
import type { TurnStepPayload } from "#execution/session/turn-step-types.js";
/** Every anonymous caller shares this one principal. */
export declare const ANONYMOUS_PRINCIPAL = "anonymous";
/**
 * Stable key for the principal a session identity acts as: only a turn's own
 * principal steers it, and one principal's queued messages share a turn.
 */
export declare function principalOf(auth: SessionAuthContext | null | undefined): string;
/**
 * The principal of the delivery that starts or continues a turn. A delivery
 * without auth keeps the session's current identity, as the turn step does.
 */
export declare function resolveTurnPrincipal(payload: TurnStepPayload | undefined, serializedContext: Record<string, unknown>): string;
/**
 * The identity a running turn continues under once a message sent as `auth`
 * joins it. Within a turn the principal is fixed and only its claims may
 * update, so only the turn's own principal may join it; input without auth
 * acts as the turn's identity. Anyone else's answers settle requests as their
 * responder without joining the turn.
 */
export declare function continueTurnAuth<T extends SessionAuthContext | null | undefined>(turnAuth: T, auth: SessionAuthContext | null | undefined): T | SessionAuthContext | null;
