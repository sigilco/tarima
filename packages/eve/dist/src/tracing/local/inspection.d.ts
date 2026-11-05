interface SpanRecord {
    readonly name: string;
    readonly attributes: Readonly<Record<string, unknown>>;
}
/** Marks the `execute_tool` span of a tool call made outside any conversation. */
export declare const DIRECT_TOOL_CALL_ATTRIBUTE = "eve.tool.invocation";
export declare const DIRECT_TOOL_CALL_VALUE = "direct";
/**
 * A direct tool call has no turn, so its own span is what starts and ends
 * its claim on the trace, the way an activation span does for a turn.
 */
export declare function isDirectToolCallSpan(span: Pick<SpanRecord, "attributes">): boolean;
export declare function isAgentActivationSpan(span: SpanRecord): boolean;
export declare function agentTurnIdentity(span: SpanRecord): string | undefined;
export {};
