import type { DurableSessionState } from "#execution/durable-session-store.js";
import type { HarnessModelMessage } from "#harness/messages.js";
import type { WorkflowEntryResult } from "#execution/session/entry-input.js";
/** The old driver owns final notifications for the dispatch that became this session. */
export declare function completeLegacyDriverStep(input: {
    readonly completionToken: string;
    readonly history: HarnessModelMessage[];
    readonly result: WorkflowEntryResult;
    readonly serializedContext: Record<string, unknown>;
    readonly sessionState: DurableSessionState;
    readonly sessionWritable: WritableStream<Uint8Array>;
}): Promise<void>;
