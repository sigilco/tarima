import { type McpLifecycle } from "./mcp.js";
import type { AgentTelemetry, CaptureDecision, ContentSerializer, ExecutionContext, Operation, ScopeData, ScopeIdentity, ScopeRecord, ScopeTerminal, TraceErrorHandler, TraceLink, TraceReference, Usage } from "./types.js";
export interface ChildOptions {
    readonly links?: readonly TraceLink[];
    readonly startTimeMs?: number;
}
export interface LiveOperation extends Operation {
    child(data: ScopeData, key?: string, options?: ChildOptions): Promise<LiveOperation>;
    /** Returns an unsettled child with this identity, without starting one. */
    find(data: ScopeData): LiveOperation | undefined;
    /** Unsettled children, in start order. */
    readonly children: readonly LiveOperation[];
    usage(usage: Usage, key?: string): Promise<void>;
    /** Carries a model call's messages up to its turn: the first input and the latest output. */
    turnContent(content: {
        readonly input?: string;
        readonly output?: string;
    }): void;
    error(error?: unknown, type?: string): void;
    /** Replaces the host context for this operation and its descendants. */
    useContext(context: ExecutionContext): void;
    /** Fills in a deferred operation's details from a later call with the same identity. */
    refine(data: ScopeData, startTimeMs?: number): void;
    /** Lowers capture for this operation and its children, and drops retained content it no longer allows. */
    narrow(capture: CaptureDecision): void;
    /** Completes this operation, or closes the open descendants of a finished one. */
    release(result: ScopeTerminal): Promise<void>;
    /** Finished, with no unfinished descendants. */
    readonly settled: boolean;
    readonly callId?: string;
    readonly mcp: McpLifecycle;
    record(): ScopeRecord;
}
export declare function createScopes(input: {
    readonly telemetry: AgentTelemetry;
    readonly serializer: ContentSerializer;
    readonly durable: boolean;
    readonly onError?: TraceErrorHandler;
}): {
    /** Starts a turn tree. Durable turns reserve their IDs from `key`. */
    start(facts: {
        identity: ScopeIdentity;
        key: string;
        capture: CaptureDecision;
        data: ScopeData;
        parent?: TraceReference;
        reference?: TraceReference;
        startTimeMs?: number;
        links?: readonly TraceLink[];
        context?: ExecutionContext;
        onChange?: () => Promise<void>;
    }): Promise<LiveOperation>;
    /** Rebuilds a tree from a checkpoint, or returns `undefined` for an unusable one. */
    restore(snapshot: unknown, options?: {
        capture?: CaptureDecision;
        context?: ExecutionContext;
        onChange?: () => Promise<void>;
    }): Promise<LiveOperation | undefined>;
};
