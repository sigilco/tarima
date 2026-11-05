/** Instrumentation providers keyed by their path-derived slot name. */
export interface InstrumentationLayout {
    readonly kind: "directory";
    readonly modulePathsBySlot: Readonly<Record<string, string>>;
}
/**
 * Resolves the instrumentation layout for one agent root.
 *
 * An empty directory layout still installs eve's built-in destinations.
 * The removed single-file layout is rejected with a migration-oriented error.
 */
export declare function resolveInstrumentationLayout(input: {
    readonly agentRoot: string;
}): InstrumentationLayout;
