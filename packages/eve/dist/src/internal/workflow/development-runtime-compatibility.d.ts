export type DevelopmentGenerationAvailability = {
    readonly kind: "ready";
    readonly runtimeAppRoot: string;
} | {
    readonly kind: "missing";
    readonly reason: string;
} | {
    readonly kind: "ineligible";
    readonly reason: string;
};
/** Recovery checks snapshot readability, not whether changed code will replay successfully. */
export declare function readDevelopmentGenerationAvailability(appRoot: string, generationId: string): Promise<DevelopmentGenerationAvailability>;
