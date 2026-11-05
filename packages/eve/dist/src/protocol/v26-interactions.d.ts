import type { InteractionOutcome, InteractionRequest } from "#protocol/session-events/families/interaction.js";
type Data = Readonly<Record<string, unknown>>;
/** A v26 question, tool approval, or session limit as the request a v27 reader shows. */
export declare function v26InteractionRequest(request: Data): InteractionRequest;
/** How a v26 resolution's outcome settles the interaction it resolved. */
export declare function v26InteractionOutcome(outcome: unknown): InteractionOutcome;
/** A v26 `authorization.required` event's data as the sign-in a v27 reader shows. */
export declare function v26SignInRequest(data: Data): InteractionRequest;
/** How a v26 `authorization.completed` outcome settles its sign-in. */
export declare function v26SignInOutcome(outcome: unknown): InteractionOutcome;
export {};
