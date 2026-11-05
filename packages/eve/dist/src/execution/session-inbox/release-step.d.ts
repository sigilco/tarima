/** Commit disposal before readers stop: Workflow delivers earlier hook events before this step resolves. */
export declare function releaseSessionHooksStep(input: {
    readonly ownerRunId: string;
    readonly tokens: readonly string[];
}): Promise<void>;
