import type { InvokeToolResult } from "#channel/invoke-tool.js";
import type { SessionAuthContext } from "#channel/types.js";
import type { ChannelAdapter } from "#channel/adapter.js";
/** Where a direct tool call came from, so trace policy can classify it like a conversation. */
export interface InvokeToolTraceOrigin {
    readonly adapter: ChannelAdapter<any>;
    readonly agentName: string;
    readonly channelName: string;
}
/**
 * Runs one direct tool call the way a conversation runs a model-issued one,
 * minus the turn around it.
 *
 * Instrumentation providers get the same `call.requested` and
 * `call.settled` events, and the `execute_tool` span carries the same
 * attributes. Content follows the same decision: the OpenTelemetry
 * declaration's content setting, the trace policy, and the channel audience
 * ceiling. Arguments, the result, and error text are recorded only when that
 * decision allows them; otherwise a failure is a generic error. Error content
 * is switched off until the span exists, so a trace policy that throws, or a
 * call whose span is dropped, never writes error text to a parent span. A
 * throwing policy is logged as a warning, which never touches a span.
 *
 * The span is marked as a direct call so trace processors treat it as the
 * call's activation: it claims the trace when it starts and completes it
 * when it ends. The call flushes the runtime afterwards so that completion
 * is released even on a deployment that only serves direct calls.
 */
export declare function withInvokeToolSpan(input: {
    /** The agent's name, on the span whether or not the call has a channel origin. */
    readonly agentName: string;
    readonly auth: SessionAuthContext;
    readonly input: unknown;
    readonly callId: string;
    readonly origin: InvokeToolTraceOrigin | undefined;
    /** The call's own run id, never a tool session's: traces see each call as one run. */
    readonly sessionId: string;
    readonly toolName: string;
}, run: (observer: InvokeToolObserver) => Promise<InvokeToolResult>): Promise<InvokeToolResult>;
/**
 * What the call reports while it runs, so providers and the span see the
 * same steps a model-issued call goes through.
 */
export interface InvokeToolObserver {
    /** The tool's `execute` is about to run with its checked input, the input the span records. */
    executing(input: unknown): Promise<void>;
    /**
     * `execute` settled with this output, or threw this error, after running
     * for `durationMs`: measured from just before `execute` to its settlement,
     * so provider handlers are not counted, as in the AI SDK.
     */
    executed(outcome: ({
        readonly type: "result";
        readonly output: unknown;
    } | {
        readonly type: "error";
        readonly error: unknown;
    }) & {
        readonly durationMs: number;
    }): Promise<void>;
    /** The error behind a `failed` result, recorded on the span when outputs are. */
    failedWith(error: unknown): void;
}
