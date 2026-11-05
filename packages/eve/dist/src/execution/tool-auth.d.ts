import type { SessionAuthContext } from "#channel/types.js";
import type { ApprovalResponseAuth } from "#approval/definition.js";
import type { ToolContext, ToolExecuteOptions } from "#tools/definition.js";
type ToolExecuteWithAuthInput<TInput> = {
    readonly scope: string;
    readonly execute: (toolInput: TInput, ctx: ToolContext) => unknown;
};
/** Supplies the shared auth capability to one authored tool execution. */
export declare function createToolExecuteWithAuth<TInput>(input: ToolExecuteWithAuthInput<TInput>): (toolInput: TInput, options: ToolExecuteOptions) => AsyncIterable<unknown> | Promise<unknown>;
/** Binds the same capability to the person responding to an approval. */
export declare function buildApprovalResponseAuth(input: {
    readonly responder: SessionAuthContext;
    readonly scope: string;
}): ApprovalResponseAuth;
/** Starts authorization requested by an approval response authorizer. */
export declare function handleApprovalResponsePolicyError(error: unknown): Promise<unknown>;
export {};
