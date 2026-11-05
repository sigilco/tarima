interface ExternalCredentialRequirement {
    readonly method?: string;
    readonly reference: string;
    readonly service: string;
    readonly subjectTypes: readonly ("app" | "user")[];
}
export interface VercelConnectMetadata {
    readonly connector: string;
    readonly requirement?: ExternalCredentialRequirement;
}
export declare function extractVercelConnectMetadata(value: unknown): VercelConnectMetadata | undefined;
export {};
