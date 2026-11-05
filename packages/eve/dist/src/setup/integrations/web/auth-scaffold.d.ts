/** Checks authored files before provisioning, then returns the local scaffold operation. */
export declare function prepareWebAuthScaffold(input: {
    environmentRoot: string;
    agentAppRoot: string;
    webRoot?: string;
    force?: boolean;
}): Promise<() => Promise<void>>;
