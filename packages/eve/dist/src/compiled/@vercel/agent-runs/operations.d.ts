import type { LiveOperation } from "./core/scopes.js";
import type { StepOptions, TraceLink, ScopeData, ScopeTerminal, ModelOptions, ToolOptions, ModelResult, CaptureDecision, Attributes, TraceReference, TraceErrorHandler } from "./core/types.js";
type Completion = ScopeTerminal & {
    errorType?: string;
    result?: ModelResult;
};
export interface Operation {
    readonly type: ScopeData["type"];
    readonly reference: TraceReference;
    readonly parent?: TraceReference;
    readonly startTimeMs: number;
    readonly finished: boolean;
    readonly capture: CaptureDecision;
    run<T>(execute: () => T, ceiling?: CaptureDecision): T;
    attributes(attributes: Attributes): void;
    complete(result?: Completion): Promise<void>;
    fail(error: unknown): Promise<void>;
    /** Records a failure without ending the operation; completion keeps it. */
    recordError(error: unknown, errorType?: string): void;
}
export interface WrappedOperation<I, H extends Operation> {
    (input: I): Promise<H>;
    <T>(input: I & {
        describe?: (value: T) => Completion;
    }, execute: (operation: H) => T | PromiseLike<T>): Promise<T>;
}
type MemoryInput = Extract<ScopeData, {
    type: "memory";
}>["options"];
export interface AttemptInput {
    readonly stepIndex: number;
    readonly attempt: number;
    readonly runtimeContext?: StepOptions["runtimeContext"];
    readonly channel?: StepOptions["channel"];
    readonly links?: readonly TraceLink[];
}
export interface TurnOperation extends Operation {
    attempt: WrappedOperation<AttemptInput, AttemptOperation>;
    /** Returns an open attempt without starting one. Durable turns only. */
    findAttempt(input: {
        stepIndex: number;
        attempt: number;
    }): AttemptOperation | undefined;
    /** Returns an open tool call from any attempt of this turn. Durable turns only. */
    findTool(callId: string): ToolOperation | undefined;
    /** Replaces the turn's links before its deferred span is exported. */
    links(links: readonly TraceLink[]): void;
    memory: WrappedOperation<MemoryInput, MemoryOperation>;
}
/**
 * One tool call. In a durable turn, calling `tool` again with the same `callId`
 * returns the same call and fills in details it did not have, such as `kind`,
 * `arguments`, or an earlier `startTimeMs`.
 */
export interface ToolInput extends ToolOptions {
    readonly startTimeMs?: number;
}
export interface AttemptOperation extends Operation {
    tool: WrappedOperation<ToolInput, ToolOperation>;
    callSubAgent: WrappedOperation<{
        callId: string;
        agentName: string;
    }, ToolOperation>;
    callRemoteAgent: WrappedOperation<{
        callId: string;
        agentName: string;
    }, ToolOperation>;
    modelCall(input: ModelOptions, key?: string): Promise<ModelOperation>;
    modelCall<T>(input: ModelOptions, execute: () => ModelCallReturn<T> | PromiseLike<ModelCallReturn<T>>): Promise<T>;
    modelStream<T>(input: ModelOptions, execute: () => ModelStreamReturn<T> | PromiseLike<ModelStreamReturn<T>>): Promise<T>;
    memory: WrappedOperation<MemoryInput, MemoryOperation>;
}
export interface ToolOperation extends Operation {
    approval: WrappedOperation<{
        requestId: string;
        request?: unknown;
    }, ApprovalOperation>;
    /** Returns an open approval without starting one. Durable turns only. */
    findApproval(requestId: string): ApprovalOperation | undefined;
    /** A tool call made while this tool runs, such as a connector's nested call. */
    tool: WrappedOperation<ToolInput, ToolOperation>;
    memory: WrappedOperation<MemoryInput, MemoryOperation>;
}
export type ModelOperation = Operation;
export type ApprovalOperation = Operation;
export type MemoryOperation = Operation;
export interface ModelCallReturn<T> extends ModelResult {
    readonly result: T;
}
export interface ModelStreamReturn<T> {
    readonly result: T;
    readonly completion: PromiseLike<ModelResult>;
}
export declare function wrappedOperation<I, H extends Operation>(start: (input: I) => Promise<H>, fallback?: Completion, onError?: TraceErrorHandler): WrappedOperation<I, H>;
export declare function operationHandle(runtime: LiveOperation, data: ScopeData, onError?: TraceErrorHandler): TurnOperation | AttemptOperation | ToolOperation | Operation;
export {};
