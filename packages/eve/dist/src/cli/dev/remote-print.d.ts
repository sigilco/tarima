/** Sends one remote turn without starting the terminal UI. */
export declare function runRemotePrint(input: {
    readonly headers?: Readonly<Record<string, string>>;
    readonly prompt: string;
    readonly serverUrl: string;
    readonly signal: AbortSignal;
    readonly workspaceRoot: string;
}): Promise<string>;
