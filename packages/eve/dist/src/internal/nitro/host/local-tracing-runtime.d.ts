/** Captures a dev worker's traces locally when the agent has no authored instrumentation. */
export declare function installLocalTracing(nitroApp: {
    readonly hooks: {
        hook(name: "close", handler: () => Promise<void>): unknown;
    };
}): void;
