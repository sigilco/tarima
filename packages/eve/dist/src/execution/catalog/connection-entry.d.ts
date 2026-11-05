/**
 * A connection's catalog entries. `<connection>__<tool>` calls one of its
 * tools: it applies the connection's approval under the entry's name and runs
 * an approved call only against the connection instance it was approved for.
 * The connection's own name signs the user in, so its tools become listable.
 */
import { type ApprovalPolicy } from "#approval/definition.js";
import type { HarnessToolDefinition } from "#harness/execute-tool.js";
import type { ConnectionRegistry } from "#runtime/connections/registry-types.js";
import type { ResolvedConnectionDefinition } from "#runtime/types.js";
/** The entry for one tool of one connection instance in `registry`. */
export declare function connectionEntry(registry: ConnectionRegistry, connection: ResolvedConnectionDefinition, toolName: string, agentApproval?: ApprovalPolicy): HarnessToolDefinition;
/**
 * The entry for a connection's own name: it signs the user in when listing the
 * connection's tools needs that, then points the model at `eve__search`.
 */
export declare function connectionSignInEntry(registry: ConnectionRegistry, connection: ResolvedConnectionDefinition): HarnessToolDefinition;
