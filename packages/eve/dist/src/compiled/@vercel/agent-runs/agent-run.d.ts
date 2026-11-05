import { type TurnOperation } from "./operations.js";
import type { AgentTelemetry, Attributes, CaptureDecision, ContentSerializer, ExecutionContext, FrameworkIdentity, RunIdentity, TraceCheckpointer, TraceErrorHandler, TraceLink, TraceReference } from "./core/types.js";
export interface AgentRunOptions {
    /** Span output and context propagation. Defaults to the global OpenTelemetry provider. */
    readonly telemetry?: AgentTelemetry;
    /**
     * Makes turns durable. Each in-flight turn is saved under a library-chosen
     * key and removed when the turn and its open tool calls complete. Calling
     * `turn()` again with the same identity, in this or a later process,
     * continues the saved turn.
     */
    readonly checkpointer?: TraceCheckpointer;
    /** Defaults to the AI SDK content serializer. */
    readonly serializer?: ContentSerializer;
    readonly onError?: TraceErrorHandler;
}
export interface TurnInput {
    readonly identity: RunIdentity;
    /** Names the invocation span. Omit for an anonymous agent. */
    readonly agentName?: string;
    readonly sequence: number;
    readonly framework?: FrameworkIdentity;
    readonly capture?: CaptureDecision;
    readonly attributes?: Attributes;
    /**
     * Adopts a trace and span ID reserved before the turn started, such as one
     * already returned to a caller. Requires telemetry with stable `ids`.
     */
    readonly reference?: TraceReference;
    /**
     * Nests the turn under a caller's span in the caller's trace. A local
     * handoff sets this for the first turn; remote callees start their own trace.
     */
    readonly parent?: TraceReference;
    readonly links?: readonly TraceLink[];
    readonly startTimeMs?: number;
    /** Delegation lineage recorded by the host, when it is not carried by a handoff. */
    readonly lineage?: {
        readonly parentRunId?: string;
        readonly parentCallId?: string;
        readonly agentName?: string;
    };
    readonly channel?: {
        readonly kind?: string;
        readonly origin?: string;
    };
    /** Host context for spans this process starts, such as OpenTelemetry baggage. */
    readonly context?: ExecutionContext;
}
export interface ResumeInput {
    readonly identity: RunIdentity;
    readonly context?: ExecutionContext;
}
interface MemoryInput<T> {
    identity: RunIdentity;
    storeId: string;
    slot: string;
    phase: string;
    capture?: CaptureDecision;
    /** Defaults to the active operation. */
    parent?: TraceReference;
    context?: ExecutionContext;
    describe?: (value: T) => {
        recordCount?: number;
        records?: readonly {
            id?: string;
            content: string;
        }[];
    };
}
export interface AgentRun {
    turn: import("./operations.js").WrappedOperation<TurnInput, TurnOperation>;
    /** Returns a saved durable turn, without starting one. */
    resume(input: ResumeInput): Promise<TurnOperation | undefined>;
    memory: AgentMemoryTracing;
    forceFlush(): Promise<void>;
    shutdown(): Promise<void>;
}
export interface AgentMemoryTracing {
    search<T>(data: MemoryInput<T>, execute: () => T | PromiseLike<T>): Promise<T>;
    write<T>(data: MemoryInput<T>, execute: () => T | PromiseLike<T>): Promise<T>;
}
export declare function createAgentRun(input: AgentRunOptions): AgentRun;
export {};
