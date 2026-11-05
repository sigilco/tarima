import type { RunUsageTally } from "#execution/agent-sessions/usage.js";
import type { WorkflowToolRunContext } from "#execution/tools/workflow/ask.js";
import type { AgentSession, AgentSessionOptions } from "#tools/workflow-definition.js";
/**
 * Opens `ctx.agent` sessions for a workflow run. A handle's position in the
 * run names its session, so replay reaches the same one, and `close` ends
 * every session the run opened, cancelling any turn still running.
 */
export declare function createAgentSessions(run: WorkflowToolRunContext, usage: RunUsageTally): {
    readonly close: () => Promise<void>;
    readonly open: (name: string, options?: AgentSessionOptions) => AgentSession;
};
