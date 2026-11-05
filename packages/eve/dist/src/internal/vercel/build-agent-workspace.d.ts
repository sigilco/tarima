import type { AgentWorkspace } from "#internal/project-context.js";
/** Emit the inferred Vercel Services project for a strict hostless workspace. */
export declare function buildAgentWorkspace(workspace: AgentWorkspace, options?: {
    readonly skipSandboxPrewarm?: boolean;
}): Promise<string>;
