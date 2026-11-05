import type { ConversationState } from "#client/conversation-state.js";
import type { SessionStoreSnapshot } from "#client/session-store.js";
import type { ErrorInfo } from "#protocol/session-events/envelope.js";
import type { SessionView } from "#protocol/session-projection/tables.js";
export interface TokenUsage {
    readonly inputTokens: number;
    readonly outputTokens: number;
}
/** What the terminal shows beyond the conversation's messages, read from the same tables. */
export interface TuiSessionData {
    readonly view: SessionView;
    /** Usage summed across the session; the renderer subtracts a turn baseline. */
    readonly usage: TokenUsage;
    /** The latest step's usage, whose input restates the context size. */
    readonly lastStepUsage?: {
        readonly inputTokens?: number;
        readonly outputTokens?: number;
    };
    /** The model the latest turn ran. */
    readonly modelId?: string;
    /** Each distinct turn or session failure, in order, with the turn it ended. */
    readonly failures: readonly TuiFailure[];
    readonly sessionFailed: boolean;
    /** The tool's authored copy for a call, which the conversation's one `label` doesn't separate. */
    readonly toolLabels: (callId: string) => ToolLabels | undefined;
    /** Calls the session refused for the model to retry; people only see the retry. */
    readonly withdrawn: (callId: string) => boolean;
}
/** A failure, and the turn it ended when it ended one. */
export interface TuiFailure {
    readonly error: ErrorInfo;
    readonly turnId?: string;
}
export interface ToolLabels {
    readonly start?: string;
    readonly complete?: string;
}
export declare function tuiSessionData(conversation: ConversationState): TuiSessionData;
/** One rendered failure cascade. */
export interface AgentTUIFailure {
    readonly message: string;
    readonly hint?: string;
    /** Diagnostic dump for unrecognized failures. */
    readonly detail?: string;
    /** The turn the failure ended; a failure of none renders after the conversation. */
    readonly turnId?: string;
}
/** Everything the renderer draws for the session, derived from one store snapshot. */
export interface AgentTUIConversationView {
    readonly conversation: ConversationState;
    /** A turn is being submitted or is running, including server-initiated turns. */
    readonly working: boolean;
    readonly data: TuiSessionData;
    readonly failures: readonly AgentTUIFailure[];
}
export declare function conversationView(snapshot: SessionStoreSnapshot, data: TuiSessionData, 
/** Replaces a failure's harness hint with a surface-local fix. */
failureHint?: (error: ErrorInfo) => string | undefined): AgentTUIConversationView;
export declare function isWorking(status: SessionStoreSnapshot["status"]): boolean;
