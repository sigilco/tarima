import { type GitHubConfig } from "./github-shell.ts";
declare const GH_TOOL_SCOPE: {
    readonly repository: "Connect mints a GitHub App installation token for that repository, or for the owner's installation when repository is an owner.";
    readonly caller: "Connect resolves the caller's own GitHub token, which carries the caller's GitHub permissions, so GitHub allows whatever the caller can access.";
};
/** Describes the `gh` tool for app-installation (`repository`) or user-scoped (`caller`) tokens. */
export declare function ghToolDescription(scope: keyof typeof GH_TOOL_SCOPE): string;
export declare const GH_TOOL_DESCRIPTION: string;
/** The Connect-brokered `gh` tool, rebuilt by the dynamic resolver with its current config. */
export declare function defineGhTool(github: () => GitHubConfig | undefined, description?: string): import("eve/tools").ToolDefinition<{
    command: string;
    repository?: string | undefined;
    description: string;
    workingDirectory?: string | undefined;
}, {
    exitCode: number;
    stderr: string;
    stdout: string;
    truncated: boolean;
}> & {
    execute(input: {
        command: string;
        repository?: string | undefined;
        description: string;
        workingDirectory?: string | undefined;
    }, ctx: import("eve/tools").ToolContext): Promise<import("./github-shell.ts").GitHubShellOutput>;
};
export {};
