import { type ToolDefinition } from "#public/tools/index.js";
export interface NoReplyToolInput {
    reason?: string;
}
/**
 * Defines the opt-in `no_reply` tool, which ends the turn without a reply.
 *
 * Export it from `agent/tools/no_reply.ts`:
 *
 * ```ts
 * import { noReply } from "eve/tools/no_reply";
 *
 * export default noReply;
 * ```
 *
 * A turn that ends with `no_reply` completes without a final message, so
 * channels and schedules post nothing. Only root sessions receive it.
 * A root session also accepts a model call returning no text with
 * `finishReason: "stop"` without retry. Delegated sessions still retry empty
 * replies and report a failure if recovery is exhausted.
 * This tool records an explicit choice to stay quiet and an optional reason
 * instead of relying on blank model output.
 */
export declare const noReply: ToolDefinition<NoReplyToolInput, string>;
