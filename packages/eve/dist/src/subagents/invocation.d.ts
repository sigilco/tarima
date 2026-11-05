import type { MessageContent } from "#shared/message-content.js";
import type { StepInput } from "#harness/types.js";
import type { SessionParent, SessionTraceSeed, SessionTraceRoot } from "#channel/types.js";
import type { ChannelAudience } from "#shared/channel-audience.js";
import { type JsonObject, type JsonValue } from "#shared/json.js";
export interface SubagentParentContext {
    readonly conversationId?: string;
    readonly lineage: SessionParent;
    /** The caller's trace root, which a local child inherits. */
    readonly traceRoot?: SessionTraceRoot;
    readonly continuationToken?: string;
    readonly traceContext?: SessionTraceSeed;
    readonly originAudience?: ChannelAudience;
}
/**
 * Delegated input keeps file parts beside the synthesized child instructions.
 */
interface FormattedSubagentInvocation extends StepInput {
    readonly message: MessageContent<string | URL>;
}
/**
 * Reads the `outputSchema` a `ctx.agent()` call requested. An empty `{}`
 * constrains nothing, but honoring it would flip the child into
 * structured-output mode and discard its text reply, so only a non-empty
 * object counts as a requested schema.
 */
export declare function normalizeRequestedOutputSchema(outputSchema: JsonValue | undefined): JsonObject | undefined;
type RuntimeSubagentInputFormatRequest = {
    readonly message: MessageContent<string | URL>;
    readonly name: string;
    readonly type: "runtime";
};
type LocalSubagentInputFormatRequest = {
    readonly description: string;
    readonly message: MessageContent<string | URL>;
    readonly name: string;
    readonly type: "local";
};
type RemoteSubagentInputFormatRequest = {
    readonly description: string;
    readonly message: MessageContent<string | URL>;
    readonly name: string;
    readonly type: "remote";
};
type SubagentInputFormatRequest = RuntimeSubagentInputFormatRequest | LocalSubagentInputFormatRequest | RemoteSubagentInputFormatRequest;
/**
 * Formats the stable delegated input handed to one child agent invocation.
 */
export declare function formatSubagentInput(input: SubagentInputFormatRequest): FormattedSubagentInvocation;
export {};
