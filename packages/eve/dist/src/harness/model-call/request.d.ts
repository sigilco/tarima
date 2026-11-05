import type { ModelMessage, SystemModelMessage } from "ai";
import type { HistoryState } from "#context/keys.js";
import { type HarnessModelMessage } from "#harness/messages.js";
import type { ModelProfile } from "#harness/model-profile.js";
/** One model call's messages: what the step commits, and what the model reads. */
export interface RequestMessages {
    readonly history: readonly HarnessModelMessage[];
    readonly historyState: HistoryState;
    readonly nonSystemMessages: readonly HarnessModelMessage[];
}
/**
 * The call's system prompt: a retry's note, then exactly the instructions. A string alone is sent
 * as it is; parts join into one system message, empty ones skipped, with the cache breakpoint at
 * its end.
 */
export declare function modelInstructions(input: {
    readonly instructions: string | readonly string[];
    readonly anthropicCache: ModelProfile["anthropicCache"];
    readonly extraSystemNote?: string;
}): SystemModelMessage | string | undefined;
/** A retry's note, trailing the call's messages. */
export declare function withTrailingUserNote(messages: readonly ModelMessage[], note?: string): ModelMessage[];
export declare function mergeSystemInstructions(instructions: readonly SystemModelMessage[]): SystemModelMessage | undefined;
