import type { EveProjectContext } from "#internal/project-context.js";
import { isEveProject } from "#setup/scaffold/index.js";
/**
 * Refusal shown by agent-scoped commands (`eve link`, `eve deploy`,
 * `eve channels …`) when the working directory holds no eve agent.
 */
export declare const NOT_AN_AGENT_MESSAGE = "No eve agent in this directory. Run `eve init <name>`, then run this command from inside the new project.";
interface ProjectCommandLogger {
    error(message: string): void;
}
/** Validate that a Vercel project command targets a workspace root or an eve app. */
export declare function validateWorkspaceProjectCommand(input: {
    readonly appRoot: string;
    readonly isEveProject?: typeof isEveProject;
    readonly logger: ProjectCommandLogger;
    readonly workspaceMemberMessage: (workspace: Extract<EveProjectContext, {
        kind: "workspace";
    }>["workspace"]) => string;
}): Promise<boolean>;
/** True when stdin and stdout are both TTYs — the default interactivity gate. */
export declare function hasInteractiveTerminal(): boolean;
export {};
