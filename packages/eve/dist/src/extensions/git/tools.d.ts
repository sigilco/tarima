/** The Connect-brokered `gh` tool, bound to the `eve/extensions/git` mount's `github` config. */
export declare const gh: import("../../tools/definition.ts").ToolDefinition<{
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
    }, ctx: import("../../tools/definition.ts").ToolContext): Promise<import("./extension/lib/github-shell.ts").GitHubShellOutput>;
};
