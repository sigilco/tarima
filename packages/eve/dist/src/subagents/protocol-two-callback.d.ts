import type { SubagentInteractionHookPayload } from "#channel/types.js";
import type { InteractionKind } from "#protocol/session-events/families/interaction.js";
import type { Answer } from "#protocol/session-events/families/response.js";
/** The callback kinds a protocol 2 child posts about its people's input. */
export declare const PROTOCOL_TWO_INPUT_CALLBACK_KINDS: ReadonlySet<unknown>;
/**
 * The answers a session forwarded to a protocol 2 child that it settles itself, as the child takes
 * them: every answer but an approval's, which the child settles and relays, and but the one
 * `decidedHere` names, which this session already settles its own way, such as Stop on a budget
 * prompt.
 */
export declare function protocolTwoAnswersSettledOnForward(input: {
    readonly answers: readonly Answer[];
    readonly decidedHere?: string;
    readonly kindOf: (interactionId: string) => InteractionKind | undefined;
}): Answer[];
/**
 * A protocol 2 input callback as that protocol's own parent reads it, for a parent run from before
 * v27 (the callback route resumes its hook with it as is), or `undefined` when the body is not one.
 */
export declare function parseProtocolTwoInputCallback(body: unknown): object | undefined;
/**
 * Reads a protocol 2 child's input callback as the interaction facts it records, or `undefined`
 * when the body is not one. A callback that records nothing this session mirrors, such as an
 * approval's own settlement, reads as a payload without events.
 */
export declare function readProtocolTwoInputCallback(body: unknown): SubagentInteractionHookPayload | undefined;
