import { type HarnessModelMessage } from "#harness/messages.js";
import type { CallOutcome } from "#protocol/session-events/families/call.js";
import type { JsonValue } from "#shared/json.js";
/**
 * A step's earlier attempt can publish and then be interrupted before its checkpoint. Its retry
 * runs the step again from that checkpoint, and the model reads which calls the attempt may have
 * run, so it decides what to call again.
 */
/** What an interrupted attempt published about one call. */
export interface InterruptedCall {
    readonly name: string;
    readonly input?: JsonValue;
    readonly started: boolean;
    readonly outcome?: CallOutcome;
}
/** What the model reads of a call an interrupted attempt published, by what it published. */
export declare function interruptedCallResult(call: InterruptedCall | undefined): string;
/** Which calls the attempt started, so the model decides what to run again. None: no note. */
export declare function interruptedAttemptNote(calls: ReadonlyMap<string, InterruptedCall>): HarnessModelMessage | undefined;
