type SourceEdit = {
    readonly kind: "applied";
    readonly from: string;
    readonly to: string;
    readonly nextSource: string;
} | {
    readonly kind: "bail";
    readonly reason: string;
    readonly line: number;
};
/** Reads only model expressions the source editor can safely rewrite. */
export declare function readModelSelectionFromSource(sourceText: string): Promise<string | undefined>;
/** Rewrites between a Gateway string model and an eve-owned model helper. */
export declare function applyModelSelectionToSource(sourceText: string, selection: string): Promise<SourceEdit>;
export {};
